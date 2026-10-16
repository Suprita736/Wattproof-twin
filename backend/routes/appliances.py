from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import ApplianceDB
from schemas import Appliance, ApplianceCreate

router = APIRouter(
    prefix="/api/appliances",
    tags=["Appliances"],
)


@router.get("/", response_model=list[Appliance])
def get_appliances(db: Session = Depends(get_db)):
    """Return all saved appliances."""
    return db.query(ApplianceDB).all()


@router.get("/{appliance_id}", response_model=Appliance)
def get_appliance(
    appliance_id: int,
    db: Session = Depends(get_db),
):
    """Return one appliance by its ID."""
    appliance = (
        db.query(ApplianceDB)
        .filter(ApplianceDB.id == appliance_id)
        .first()
    )

    if appliance is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appliance not found",
        )

    return appliance


@router.post(
    "/",
    response_model=Appliance,
    status_code=status.HTTP_201_CREATED,
)
def create_appliance(
    item: ApplianceCreate,
    db: Session = Depends(get_db),
):
    """Save a confirmed appliance to the existing database."""
    appliance = ApplianceDB(
        name=item.name,
        category=item.category,
        power_watts=item.power_watts,
        hours_per_day=item.hours_per_day,
        units=item.units,
        operating_days_per_week=item.operating_days_per_week,
        data_source=item.data_source,
    )

    db.add(appliance)
    db.commit()
    db.refresh(appliance)

    return appliance

@router.put(
    "/{appliance_id}",
    response_model=Appliance,
)
def update_appliance(
    appliance_id: int,
    item: ApplianceCreate,
    db: Session = Depends(get_db),
):
    """Update an existing appliance in the shared database."""
    appliance = (
        db.query(ApplianceDB)
        .filter(ApplianceDB.id == appliance_id)
        .first()
    )

    if appliance is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appliance not found",
        )

    appliance.name = item.name
    appliance.category = item.category
    appliance.power_watts = item.power_watts
    appliance.hours_per_day = item.hours_per_day
    appliance.units = item.units
    appliance.operating_days_per_week = item.operating_days_per_week
    appliance.data_source = item.data_source

    db.commit()
    db.refresh(appliance)

    return appliance


@router.delete(
    "/{appliance_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_appliance(
    appliance_id: int,
    db: Session = Depends(get_db),
):
    appliance = (
        db.query(ApplianceDB)
        .filter(ApplianceDB.id == appliance_id)
        .first()
    )

    if appliance is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appliance not found",
        )

    db.delete(appliance)
    db.commit()
    return None
