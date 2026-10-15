from sqlalchemy.orm import Session

from services.action_service import get_action


def verify_action(
    db: Session,
    action_id: int,
    observed_energy_kwh: float
):
    action = get_action(db, action_id)

    if action is None:
        return None

    predicted_energy = action.predicted_energy_kwh
    baseline_energy = action.baseline_energy_kwh

    actual_energy_saved = (
        baseline_energy - observed_energy_kwh
    )

    predicted_energy_saved = (
        action.predicted_energy_saved_kwh
    )

    if predicted_energy_saved == 0:
        prediction_accuracy = (
            100.0
            if actual_energy_saved == 0
            else 0.0
        )
    else:
        prediction_accuracy = (
            1 - abs(
                actual_energy_saved
                - predicted_energy_saved
            ) / predicted_energy_saved
        ) * 100

    prediction_accuracy = max(
        0,
        min(100, prediction_accuracy)
    )

    difference = (
        observed_energy_kwh
        - predicted_energy
    )

    if abs(difference) <= predicted_energy * 0.10:
        status = "verified"
    elif observed_energy_kwh < predicted_energy:
        status = "better_than_predicted"
    else:
        status = "below_prediction"

    # Save verification result to database
    action.observed_energy_kwh = observed_energy_kwh
    action.actual_energy_saved_kwh = actual_energy_saved
    action.prediction_accuracy_percent = prediction_accuracy
    action.status = status

    db.commit()
    db.refresh(action)

    return {
        "action_id": action.id,
        "predicted_energy_kwh": round(
            predicted_energy,
            2
        ),
        "observed_energy_kwh": round(
            observed_energy_kwh,
            2
        ),
        "predicted_energy_saved_kwh": round(
            predicted_energy_saved,
            2
        ),
        "actual_energy_saved_kwh": round(
            actual_energy_saved,
            2
        ),
        "prediction_accuracy_percent": round(
            prediction_accuracy,
            2
        ),
        "status": status,
        "data_source": "simulated"
    }