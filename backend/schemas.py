# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field

class Appliance(BaseModel):
    id: int
    name: str
    category: str
    power_watts: float = Field(gt=0)
    hours_per_day: float = Field(ge=0)
    units: int = Field(gt=0)
    operating_days_per_week: int = Field(gt=0, le=7)
    data_source: str

class EquipmentEnergy(BaseModel):
    appliance_id: int
    name: str
    daily_energy_kwh: float
    weekly_energy_kwh: float


class EnergySummary(BaseModel):
    total_daily_energy_kwh: float
    total_weekly_energy_kwh: float
    estimated_daily_cost: float
    estimated_daily_co2_kg: float
    equipment_breakdown: list[EquipmentEnergy]
    data_source: str

class SimulationRequest(BaseModel):
    appliance_id: int
    reduction_percent: float = Field(ge=0, le=100)


class SimulationResponse(BaseModel):
    appliance_id: int
    appliance: str

    baseline_energy_kwh: float
    proposed_energy_kwh: float
    energy_saved_kwh: float
    energy_saving_percent: float

    baseline_cost: float
    proposed_cost: float
    cost_saved: float

    baseline_co2_kg: float
    proposed_co2_kg: float
    co2_saved_kg: float

    data_source: str

class ActionCreate(BaseModel):
    appliance_id: int
    action_name: str
    description: str
    reduction_percent: float = Field(ge=0, le=100)


class ActionResponse(BaseModel):
    id: int
    appliance_id: int
    appliance: str
    action_name: str
    description: str
    reduction_percent: float

    baseline_energy_kwh: float
    predicted_energy_kwh: float
    predicted_energy_saved_kwh: float

    predicted_cost_saved: float
    predicted_co2_saved_kg: float

    status: str
    data_source: str

class VerificationRequest(BaseModel):
    observed_energy_kwh: float = Field(ge=0)


class VerificationResponse(BaseModel):
    action_id: int
    predicted_energy_kwh: float
    observed_energy_kwh: float

    predicted_energy_saved_kwh: float
    actual_energy_saved_kwh: float

    prediction_accuracy_percent: float

    status: str
    data_source: str