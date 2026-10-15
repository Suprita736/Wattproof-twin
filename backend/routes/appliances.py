from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import ApplianceDB
from schemas import Appliance


router = APIRouter(
    prefix="/api/appliances",
    tags=["Appliances"]
)


@router.get("/", response_model=list[Appliance])
def get_appliances(db: Session = Depends(get_db)):
    return db.query(ApplianceDB).all()


@router.get("/{appliance_id}", response_model=Appliance)
def get_appliance(
    appliance_id: int,
    db: Session = Depends(get_db)
):
    appliance = (
        db.query(ApplianceDB)
        .filter(ApplianceDB.id == appliance_id)
        .first()
    )

    if appliance is None:
        raise HTTPException(
            status_code=404,
            detail="Appliance not found"
        )

    return appliance