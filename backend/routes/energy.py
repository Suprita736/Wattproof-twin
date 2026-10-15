
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.connection import get_db
from schemas import EnergySummary
from services.energy_service import get_energy_summary

router = APIRouter(
    prefix="/api/energy",
    tags=["Energy"],
)


@router.get("/summary", response_model=EnergySummary)
def energy_summary(db: Session = Depends(get_db)):
    return get_energy_summary(db)
