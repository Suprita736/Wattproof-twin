from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.connection import get_db
from schemas import DiagnosisResponse, OccupancySettings
from services.diagnosis_service import (
    _occupancy_dict,
    get_occupancy,
    run_diagnosis,
    update_occupancy,
)

router = APIRouter(
    prefix="/api/diagnosis",
    tags=["Diagnosis"],
)


@router.get("/", response_model=DiagnosisResponse)
def diagnose(db: Session = Depends(get_db)):
    """Flag equipment that may run while the room is unoccupied."""
    return run_diagnosis(db)


@router.get("/occupancy", response_model=OccupancySettings)
def read_occupancy(db: Session = Depends(get_db)):
    return _occupancy_dict(get_occupancy(db))


@router.put("/occupancy", response_model=OccupancySettings)
def save_occupancy(
    settings: OccupancySettings,
    db: Session = Depends(get_db),
):
    """Set the assumed occupied hours per day and days per week."""
    return update_occupancy(db, settings)