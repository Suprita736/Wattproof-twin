from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from schemas import SimulationRequest, SimulationResponse
from services.simulation_service import simulate_appliance


router = APIRouter(
    prefix="/api/simulation",
    tags=["Simulation"],
)


@router.post("/", response_model=SimulationResponse)
def run_simulation(
    request: SimulationRequest,
    db: Session = Depends(get_db),
):
    result = simulate_appliance(
        db,
        request.appliance_id,
        request.reduction_percent,
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Appliance not found",
        )

    return result