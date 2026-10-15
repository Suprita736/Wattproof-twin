from sqlalchemy import Column, Float, Integer, String, Text

from database.connection import Base


class ApplianceDB(Base):
    __tablename__ = "appliances"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    power_watts = Column(Float, nullable=False)
    hours_per_day = Column(Float, nullable=False)
    units = Column(Integer, nullable=False)
    operating_days_per_week = Column(Integer, nullable=False)
    data_source = Column(String, nullable=False)


class ActionDB(Base):
    __tablename__ = "actions"

    id = Column(Integer, primary_key=True, index=True)

    appliance_id = Column(Integer, nullable=False)
    appliance = Column(String, nullable=False)

    action_name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    reduction_percent = Column(Float, nullable=False)

    baseline_energy_kwh = Column(Float, nullable=False)
    predicted_energy_kwh = Column(Float, nullable=False)
    predicted_energy_saved_kwh = Column(Float, nullable=False)

    predicted_cost_saved = Column(Float, nullable=False)
    predicted_co2_saved_kg = Column(Float, nullable=False)

    status = Column(String, nullable=False)
    data_source = Column(String, nullable=False)

    # Verification fields
    observed_energy_kwh = Column(Float, nullable=True)
    actual_energy_saved_kwh = Column(Float, nullable=True)
    prediction_accuracy_percent = Column(Float, nullable=True)