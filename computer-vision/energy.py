
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/energy", tags=["Energy"])

class EnergyEstimateRequest(BaseModel):
    power_watts: float = Field(gt=0, le=50000)
    quantity: int = Field(default=1, ge=1, le=100)
    hours_per_day: float = Field(gt=0, le=24)
    days: int = Field(default=1, ge=1, le=365)

@router.post("/estimate")
def estimate_energy(data: EnergyEstimateRequest):
    total_power_watts = data.power_watts * data.quantity
    energy_kwh = (
        total_power_watts
        * data.hours_per_day
        * data.days
        / 1000
    )

    return {
        "total_power_watts": round(total_power_watts, 2),
        "hours_per_day": data.hours_per_day,
        "days": data.days,
        "estimated_energy_kwh": round(energy_kwh, 3),
        "basis": "user-provided rated power and usage duration",
        "is_measured_consumption": False,
    }
