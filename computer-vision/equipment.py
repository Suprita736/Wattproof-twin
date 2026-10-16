
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/equipment", tags=["Equipment"])

VALID_APPLIANCES = {
    "television",
    "laptop",
    "ceiling_fan",
    "refrigerator",
    "air_conditioner",
    "light",
    "microwave",
}

class EquipmentConfirmation(BaseModel):
    appliance_type: str
    power_watts: float = Field(gt=0, le=50000)
    quantity: int = Field(default=1, ge=1, le=100)
    source: str = "image_detection"

@router.post("/confirm")
def confirm_equipment(item: EquipmentConfirmation):
    appliance = item.appliance_type.strip().lower()

    if appliance not in VALID_APPLIANCES:
        raise HTTPException(
            status_code=422,
            detail="Unsupported appliance type."
        )

    return {
        "equipment_id": str(uuid4()),
        "appliance_type": appliance,
        "power_watts": item.power_watts,
        "quantity": item.quantity,
        "total_power_watts": item.power_watts * item.quantity,
        "source": item.source,
        "status": "confirmed",
        "measurement_type": "user_confirmed_rated_power",
    }
