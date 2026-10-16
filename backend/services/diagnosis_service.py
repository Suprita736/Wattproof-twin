from sqlalchemy.orm import Session

from database.models import ApplianceDB, OccupancyDB
from schemas import OccupancySettings
from services.energy_service import (
    GRID_EMISSION_FACTOR,
    TARIFF_PER_KWH,
)

# Prototype defaults: a classroom used 6 hours a day, 5 days a week.
DEFAULT_OCCUPIED_HOURS = 6.0
DEFAULT_OCCUPIED_DAYS = 5

# Equipment that legitimately runs all day is never flagged.
ALWAYS_ON_KEYWORDS = (
    "refrigerator",
    "fridge",
    "freezer",
    "server",
    "router",
)

# An appliance is flagged when at least this much of its weekly energy
# is used while the room is unoccupied, and it runs at least this many
# unoccupied hours per week.
MIN_WASTE_SHARE = 0.10
MIN_UNOCCUPIED_HOURS = 1.0


def get_occupancy(db: Session) -> OccupancyDB:
    row = db.query(OccupancyDB).first()

    if row is None:
        row = OccupancyDB(
            id=1,
            occupied_hours_per_day=DEFAULT_OCCUPIED_HOURS,
            occupied_days_per_week=DEFAULT_OCCUPIED_DAYS,
        )
        db.add(row)
        db.commit()
        db.refresh(row)

    return row


def _occupancy_dict(row: OccupancyDB) -> dict:
    return {
        "occupiedHoursPerDay": row.occupied_hours_per_day,
        "occupiedDaysPerWeek": row.occupied_days_per_week,
    }


def update_occupancy(db: Session, data: OccupancySettings) -> dict:
    row = get_occupancy(db)
    row.occupied_hours_per_day = data.occupiedHoursPerDay
    row.occupied_days_per_week = data.occupiedDaysPerWeek
    db.commit()
    db.refresh(row)
    return _occupancy_dict(row)


def _is_always_on(appliance: ApplianceDB) -> bool:
    text = f"{appliance.name} {appliance.category}".lower()
    return any(word in text for word in ALWAYS_ON_KEYWORDS)


def _finding(appliance: ApplianceDB, occupied_weekly_hours: float) -> dict:
    kw = appliance.power_watts * appliance.units / 1000
    operating_weekly_hours = (
        appliance.hours_per_day * appliance.operating_days_per_week
    )
    weekly_energy = kw * operating_weekly_hours

    base = {
        "applianceId": appliance.id,
        "name": appliance.name,
        "category": appliance.category,
        "dataSource": appliance.data_source,
        "powerWatts": appliance.power_watts,
        "units": appliance.units,
        "daysPerWeek": appliance.operating_days_per_week,
        "currentHoursPerDay": appliance.hours_per_day,
        "weeklyEnergyKwh": round(weekly_energy, 2),
    }

    if _is_always_on(appliance):
        return {
            **base,
            "status": "always_on",
            "suggestedHoursPerDay": appliance.hours_per_day,
            "unoccupiedHoursPerWeek": 0.0,
            "wasteEnergyKwh": 0.0,
            "wasteCost": 0.0,
            "wasteCo2Kg": 0.0,
            "explanation": (
                "Runs continuously by design, so it is not compared "
                "with the occupancy schedule."
            ),
        }

    unoccupied_hours = max(0.0, operating_weekly_hours - occupied_weekly_hours)
    waste_energy = kw * unoccupied_hours
    share = waste_energy / weekly_energy if weekly_energy > 0 else 0.0

    # Hours per day that keep the same operating days but stop running
    # outside occupied time. Same shape as the Digital Twin scenario.
    suggested = min(
        appliance.hours_per_day,
        occupied_weekly_hours / appliance.operating_days_per_week,
    )
    suggested = round(max(0.0, suggested), 1)

    flagged = share >= MIN_WASTE_SHARE and unoccupied_hours >= MIN_UNOCCUPIED_HOURS

    if flagged:
        explanation = (
            f"Runs about {unoccupied_hours:.1f} h/week while the room is "
            f"unoccupied ({share * 100:.0f}% of its weekly energy). "
            f"Limiting it to about {suggested} h/day would remove that."
        )
    else:
        explanation = (
            "Operating time is within the assumed occupied schedule."
        )

    return {
        **base,
        "status": "possible_waste" if flagged else "ok",
        "suggestedHoursPerDay": suggested,
        "unoccupiedHoursPerWeek": round(unoccupied_hours, 1),
        "wasteEnergyKwh": round(waste_energy, 2),
        "wasteCost": round(waste_energy * TARIFF_PER_KWH, 2),
        "wasteCo2Kg": round(waste_energy * GRID_EMISSION_FACTOR, 2),
        "explanation": explanation,
    }


def run_diagnosis(db: Session) -> dict:
    occupancy = get_occupancy(db)
    occupied_weekly_hours = (
        occupancy.occupied_hours_per_day * occupancy.occupied_days_per_week
    )

    appliances = db.query(ApplianceDB).order_by(ApplianceDB.id).all()
    findings = [_finding(a, occupied_weekly_hours) for a in appliances]

    order = {"possible_waste": 0, "ok": 1, "always_on": 2}
    findings.sort(key=lambda f: (order[f["status"]], -f["wasteEnergyKwh"]))

    total_energy = sum(f["weeklyEnergyKwh"] for f in findings)
    total_waste = sum(
        f["wasteEnergyKwh"] for f in findings
        if f["status"] == "possible_waste"
    )

    return {
        "occupancy": _occupancy_dict(occupancy),
        "findings": findings,
        "totalWeeklyEnergyKwh": round(total_energy, 2),
        "totalWasteEnergyKwh": round(total_waste, 2),
        "wastePercent": round(
            (total_waste / total_energy) * 100 if total_energy > 0 else 0.0,
            1,
        ),
        "dataMode": "ESTIMATED",
        "note": (
            "Estimates from the saved equipment inventory and an assumed "
            "occupancy schedule, not from metered readings."
        ),
    }