# pyrefly: ignore [missing-import]
from fastapi import APIRouter

from schemas import EnergySummary
from services.energy_service import get_energy_summary


router = APIRouter(
    prefix="/api/energy",
    tags=["Energy"]
)


@router.get("/summary", response_model=EnergySummary)
def energy_summary():
    return get_energy_summary()