from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

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



def _utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class PassportDB(Base):
    __tablename__ = "passports"

    id = Column(String, primary_key=True, index=True)
    appliance_id = Column(Integer, nullable=True)
    equipment = Column(String, nullable=False)
    action = Column(Text, nullable=False)
    equipment_source = Column(String, nullable=False, default="unknown")
    assumptions = Column(JSON, nullable=False)
    prediction = Column(JSON, nullable=False)
    created_at = Column(DateTime, nullable=False, default=_utc_now)

    readings = relationship(
        "ReadingDB",
        back_populates="passport",
        cascade="all, delete-orphan",
        order_by="ReadingDB.reading_date, ReadingDB.id",
    )


class ReadingDB(Base):
    __tablename__ = "passport_readings"

    id = Column(Integer, primary_key=True, index=True)
    passport_id = Column(
        String, ForeignKey("passports.id"), nullable=False, index=True
    )
    reading_date = Column(Date, nullable=False)
    observed_weekly_kwh = Column(Float, nullable=False)
    source = Column(String, nullable=False)
    notes = Column(Text, nullable=False, default="")
    created_at = Column(DateTime, nullable=False, default=_utc_now)

    passport = relationship("PassportDB", back_populates="readings")



class OccupancyDB(Base):
    __tablename__ = "occupancy_settings"

    id = Column(Integer, primary_key=True)
    occupied_hours_per_day = Column(Float, nullable=False)
    occupied_days_per_week = Column(Integer, nullable=False)