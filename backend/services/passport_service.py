from datetime import date, datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy.orm import Session

from database.models import PassportDB, ReadingDB
from schemas import PassportCreate, ReadingCreate

# A follow-up supports the prediction when at least this share of the
# predicted weekly saving was actually achieved.
ACHIEVED_THRESHOLD_PERCENT = 90.0

# Allows for time-zone differences between the user and the server.
DATE_TOLERANCE = timedelta(days=1)


class PassportError(ValueError):
    """Raised for invalid input that should become a 422 response."""


def _iso(value: datetime) -> str:
    return value.isoformat() + "Z"


def _reading_to_dict(reading: ReadingDB) -> dict:
    return {
        "id": reading.id,
        "readingDate": reading.reading_date,
        "observedWeeklyKwh": reading.observed_weekly_kwh,
        "source": reading.source,
        "measured": reading.source != "simulated_demo",
        "notes": reading.notes or "",
        "createdAt": _iso(reading.created_at),
    }


def _build_verification(passport: PassportDB):
    if not passport.readings:
        return None

    latest = passport.readings[-1]  # ordered by reading_date, id
    prediction = passport.prediction

    baseline = float(prediction["baselineEnergy"])
    predicted_proposed = float(prediction["proposedEnergy"])
    predicted_saved = float(prediction["energySaved"])

    observed = latest.observed_weekly_kwh
    observed_saved = baseline - observed
    achieved = (observed_saved / predicted_saved) * 100
    simulated = latest.source == "simulated_demo"

    if achieved >= ACHIEVED_THRESHOLD_PERCENT:
        outcome = "supports the prediction"
    else:
        outcome = "does not support the prediction"

    if simulated:
        evidence_note = (
            "This reading is simulated for demonstration. "
            "It is not measured evidence."
        )
    else:
        evidence_note = (
            "The baseline is the modelled estimate from the simulation, "
            "not a measured baseline week."
        )

    if observed_saved <= 0:
        headline = (
            "Observed use was not lower than the modelled baseline, so no "
            "saving was achieved, which does not support the prediction."
        )
        if observed > baseline * 2:
            headline += (
                " The reading is more than double the baseline; check that "
                "it is the energy for one week, in kWh."
            )
    else:
        headline = (
            f"{achieved:.0f}% of the predicted saving was achieved, "
            f"which {outcome}."
        )

    return {
        "evidence": "SIMULATED" if simulated else "MEASURED",
        "readingDate": latest.reading_date,
        "baselineKwh": round(baseline, 2),
        "predictedKwh": round(predicted_proposed, 2),
        "observedKwh": round(observed, 2),
        "predictedSavedKwh": round(predicted_saved, 2),
        "observedSavedKwh": round(observed_saved, 2),
        "differenceKwh": round(observed - predicted_proposed, 2),
        "savingsAchievedPercent": round(achieved, 1),
        "message": f"{headline} {evidence_note}",
    }


def _status(verification) -> str:
    if verification is None:
        return "Draft"

    simulated = verification["evidence"] == "SIMULATED"
    achieved = verification["savingsAchievedPercent"]

    if achieved >= ACHIEVED_THRESHOLD_PERCENT:
        return "Verified in simulation" if simulated else "Verified"

    return (
        "Below prediction (simulated)" if simulated else "Below prediction"
    )


def passport_to_dict(passport: PassportDB) -> dict:
    verification = _build_verification(passport)

    return {
        "id": passport.id,
        "applianceId": passport.appliance_id,
        "equipment": passport.equipment,
        "action": passport.action,
        "status": _status(verification),
        "dataMode": "SIMULATED",
        "equipmentSource": passport.equipment_source,
        "createdAt": _iso(passport.created_at),
        "assumptions": passport.assumptions,
        "prediction": passport.prediction,
        "readings": [_reading_to_dict(r) for r in passport.readings],
        "verification": verification,
    }


def create_passport(db: Session, data: PassportCreate) -> dict:
    passport = PassportDB(
        id=f"AP-{uuid4().hex[:8].upper()}",
        appliance_id=data.applianceId,
        equipment=data.equipment.strip(),
        action=data.action.strip(),
        equipment_source=data.equipmentSource,
        assumptions=data.assumptions,
        prediction=data.prediction.model_dump(),
    )

    db.add(passport)
    db.commit()
    db.refresh(passport)

    return passport_to_dict(passport)


def list_passports(db: Session) -> list[dict]:
    passports = (
        db.query(PassportDB).order_by(PassportDB.created_at.desc()).all()
    )
    return [passport_to_dict(p) for p in passports]


def get_passport(db: Session, passport_id: str):
    passport = (
        db.query(PassportDB).filter(PassportDB.id == passport_id).first()
    )
    return passport_to_dict(passport) if passport else None


def add_reading(db: Session, passport_id: str, data: ReadingCreate):
    passport = (
        db.query(PassportDB).filter(PassportDB.id == passport_id).first()
    )

    if passport is None:
        return None

    today = datetime.now(timezone.utc).date()

    if data.readingDate > today + DATE_TOLERANCE:
        raise PassportError("Reading date cannot be in the future.")

    if data.readingDate < passport.created_at.date() - DATE_TOLERANCE:
        raise PassportError(
            "Reading date is before this passport was created, so it "
            "cannot be a follow-up reading."
        )

    reading = ReadingDB(
        passport_id=passport.id,
        reading_date=data.readingDate,
        observed_weekly_kwh=data.observedWeeklyKwh,
        source=data.source,
        notes=data.notes.strip(),
    )

    db.add(reading)
    db.commit()
    db.refresh(passport)

    return passport_to_dict(passport)