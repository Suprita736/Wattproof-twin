from sqlalchemy.orm import Session

from database.models import ApplianceDB
from services.energy_service import (
    TARIFF_PER_KWH,
    GRID_EMISSION_FACTOR,
    calculate_daily_energy,
)


def simulate_appliance(
    db: Session,
    appliance_id: int,
    reduction_percent: float,
):
    appliance = (
        db.query(ApplianceDB)
        .filter(ApplianceDB.id == appliance_id)
        .first()
    )

    if appliance is None:
        return None

    # Baseline energy consumption (kWh per operating day)
    baseline_energy = calculate_daily_energy(
        appliance.power_watts,
        appliance.hours_per_day,
        appliance.units,
    )

    # Apply proposed reduction
    reduction_factor = 1 - (reduction_percent / 100)
    proposed_energy = baseline_energy * reduction_factor
    energy_saved = baseline_energy - proposed_energy

    # Cost calculations
    baseline_cost = baseline_energy * TARIFF_PER_KWH
    proposed_cost = proposed_energy * TARIFF_PER_KWH
    cost_saved = baseline_cost - proposed_cost

    # CO2 calculations
    baseline_co2 = baseline_energy * GRID_EMISSION_FACTOR
    proposed_co2 = proposed_energy * GRID_EMISSION_FACTOR
    co2_saved = baseline_co2 - proposed_co2

    return {
        "appliance_id": appliance.id,
        "appliance": appliance.name,

        "baseline_energy_kwh": round(baseline_energy, 2),
        "proposed_energy_kwh": round(proposed_energy, 2),
        "energy_saved_kwh": round(energy_saved, 2),
        "energy_saving_percent": reduction_percent,

        "baseline_cost": round(baseline_cost, 2),
        "proposed_cost": round(proposed_cost, 2),
        "cost_saved": round(cost_saved, 2),

        "baseline_co2_kg": round(baseline_co2, 2),
        "proposed_co2_kg": round(proposed_co2, 2),
        "co2_saved_kg": round(co2_saved, 2),

        "data_source": "simulated",
    }