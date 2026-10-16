# pyrefly: ignore [missing-import]
from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator


class Appliance(BaseModel):
    id: int
    name: str
    category: str
    power_watts: float = Field(gt=0)
    hours_per_day: float = Field(ge=0)
    units: int = Field(gt=0)
    operating_days_per_week: int = Field(gt=0, le=7)
    data_source: str


class ApplianceCreate(BaseModel):
    name: str
    category: str
    power_watts: float = Field(gt=0, le=50000)
    hours_per_day: float = Field(ge=0, le=24)
    units: int = Field(gt=0, le=100)
    operating_days_per_week: int = Field(gt=0, le=7)
    data_source: str = "image_detection"


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



# ---------- Action Passports ----------

ReadingSource = Literal[
    "utility_meter",
    "sub_meter",
    "smart_plug",
    "manual_log",
    "simulated_demo",
]


class PassportPrediction(BaseModel):
    baselineEnergy: float = Field(gt=0, le=1_000_000)
    proposedEnergy: float = Field(ge=0, le=1_000_000)
    energySaved: float
    baselineCost: float = Field(ge=0)
    proposedCost: float = Field(ge=0)
    costSaved: float
    baselineEmissions: float = Field(ge=0)
    proposedEmissions: float = Field(ge=0)
    emissionsSaved: float
    reduction: Optional[float] = None

    @model_validator(mode="after")
    def check_consistency(self):
        if self.energySaved <= 0:
            raise ValueError(
                "A passport needs a positive predicted energy saving."
            )
        expected = self.baselineEnergy - self.proposedEnergy
        if abs(expected - self.energySaved) > 0.05:
            raise ValueError(
                "energySaved must equal baselineEnergy minus proposedEnergy."
            )
        return self


class PassportCreate(BaseModel):
    applianceId: Optional[int] = None
    equipment: str = Field(min_length=1, max_length=120)
    action: str = Field(min_length=1, max_length=500)
    equipmentSource: str = Field(default="unknown", max_length=40)
    assumptions: dict[str, float | int | str]
    prediction: PassportPrediction


class ReadingCreate(BaseModel):
    readingDate: date
    observedWeeklyKwh: float = Field(ge=0, le=1_000_000)
    source: ReadingSource
    notes: str = Field(default="", max_length=500)


class ReadingResponse(BaseModel):
    id: int
    readingDate: date
    observedWeeklyKwh: float
    source: str
    measured: bool
    notes: str
    createdAt: str


class VerificationSummary(BaseModel):
    evidence: Literal["MEASURED", "SIMULATED"]
    readingDate: date
    baselineKwh: float
    predictedKwh: float
    observedKwh: float
    predictedSavedKwh: float
    observedSavedKwh: float
    differenceKwh: float
    savingsAchievedPercent: float
    message: str


class PassportResponse(BaseModel):
    id: str
    applianceId: Optional[int]
    equipment: str
    action: str
    status: str
    dataMode: Literal["SIMULATED"]
    equipmentSource: str
    createdAt: str
    assumptions: dict[str, float | int | str]
    prediction: PassportPrediction
    readings: list[ReadingResponse]
    verification: Optional[VerificationSummary]



# ---------- Diagnosis ----------

class OccupancySettings(BaseModel):
    occupiedHoursPerDay: float = Field(ge=0, le=24)
    occupiedDaysPerWeek: int = Field(ge=1, le=7)


class DiagnosisFinding(BaseModel):
    applianceId: int
    name: str
    category: str
    dataSource: str
    status: Literal["possible_waste", "ok", "always_on"]
    powerWatts: float
    units: int
    daysPerWeek: int
    currentHoursPerDay: float
    suggestedHoursPerDay: float
    weeklyEnergyKwh: float
    unoccupiedHoursPerWeek: float
    wasteEnergyKwh: float
    wasteCost: float
    wasteCo2Kg: float
    explanation: str


class DiagnosisResponse(BaseModel):
    occupancy: OccupancySettings
    findings: list[DiagnosisFinding]
    totalWeeklyEnergyKwh: float
    totalWasteEnergyKwh: float
    wastePercent: float
    dataMode: Literal["ESTIMATED"]
    note: str



# ---------- AI advisor ----------

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=1000)

    @model_validator(mode="after")
    def not_blank(self):
        if not self.content.strip():
            raise ValueError("Message cannot be blank.")
        return self


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=12)


class ChatResponse(BaseModel):
    reply: str
    model: str


class AdvisorStatus(BaseModel):
    configured: bool
    model: str