from sqlalchemy.orm import Session

from database.models import ActionDB
from services.simulation_service import simulate_appliance


def create_action(
    db: Session,
    appliance_id: int,
    action_name: str,
    description: str,
    reduction_percent: float,
):
    simulation = simulate_appliance(
        db,
        appliance_id,
        reduction_percent,
    )

    if simulation is None:
        return None

    action = ActionDB(
        appliance_id=appliance_id,
        appliance=simulation["appliance"],
        action_name=action_name,
        description=description,
        reduction_percent=reduction_percent,

        baseline_energy_kwh=simulation["baseline_energy_kwh"],
        predicted_energy_kwh=simulation["proposed_energy_kwh"],
        predicted_energy_saved_kwh=simulation["energy_saved_kwh"],

        predicted_cost_saved=simulation["cost_saved"],
        predicted_co2_saved_kg=simulation["co2_saved_kg"],

        status="pending_verification",
        data_source="simulated",
    )

    db.add(action)
    db.commit()
    db.refresh(action)

    return action


def get_actions(db: Session):
    return db.query(ActionDB).all()


def get_action(db: Session, action_id: int):
    return (
        db.query(ActionDB)
        .filter(ActionDB.id == action_id)
        .first()
    )