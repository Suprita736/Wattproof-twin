from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.connection import get_db
from schemas import PassportCreate, PassportResponse, ReadingCreate
from services.passport_service import (
    PassportError,
    add_reading,
    create_passport,
    get_passport,
    list_passports,
)

router = APIRouter(
    prefix="/api/passports",
    tags=["Action Passports"],
)


@router.post(
    "/",
    response_model=PassportResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_passport(
    request: PassportCreate,
    db: Session = Depends(get_db),
):
    """Save a simulation as an Energy Action Passport."""
    return create_passport(db, request)


@router.get("/", response_model=list[PassportResponse])
def get_all_passports(db: Session = Depends(get_db)):
    """Return all passports, newest first."""
    return list_passports(db)


@router.get("/{passport_id}", response_model=PassportResponse)
def get_single_passport(
    passport_id: str,
    db: Session = Depends(get_db),
):
    passport = get_passport(db, passport_id)

    if passport is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Passport not found",
        )

    return passport


@router.post(
    "/{passport_id}/readings",
    response_model=PassportResponse,
    status_code=status.HTTP_201_CREATED,
)
def record_follow_up_reading(
    passport_id: str,
    request: ReadingCreate,
    db: Session = Depends(get_db),
):
    """Record a follow-up reading and compare it with the prediction."""
    try:
        passport = add_reading(db, passport_id, request)
    except PassportError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        ) from error

    if passport is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Passport not found",
        )

    return passport