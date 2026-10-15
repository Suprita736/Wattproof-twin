from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.connection import get_db
from schemas import (
    ActionCreate,
    ActionResponse,
    VerificationRequest,
    VerificationResponse,
)
from services.action_service import (
    create_action,
    get_actions,
    get_action,
)
from services.verification_service import verify_action


router = APIRouter(
    prefix="/api/actions",
    tags=["Actions"],
)


@router.post(
    "/",
    response_model=ActionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_action(
    request: ActionCreate,
    db: Session = Depends(get_db),
):
    """Create an energy-saving action for an existing appliance."""
    result = create_action(
        db=db,
        appliance_id=request.appliance_id,
        action_name=request.action_name,
        description=request.description,
        reduction_percent=request.reduction_percent,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appliance not found",
        )

    return result


@router.get("/", response_model=list[ActionResponse])
def list_actions(
    db: Session = Depends(get_db),
):
    """Return all saved actions."""
    return get_actions(db)


@router.get("/{action_id}", response_model=ActionResponse)
def get_single_action(
    action_id: int,
    db: Session = Depends(get_db),
):
    """Return one action by its ID."""
    action = get_action(db, action_id)

    if action is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action not found",
        )

    return action


@router.post(
    "/{action_id}/verify",
    response_model=VerificationResponse,
)
def verify_existing_action(
    action_id: int,
    request: VerificationRequest,
    db: Session = Depends(get_db),
):
    """Compare observed energy with the predicted energy for an action."""
    result = verify_action(
        db=db,
        action_id=action_id,
        observed_energy_kwh=request.observed_energy_kwh,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action not found",
        )

    return result