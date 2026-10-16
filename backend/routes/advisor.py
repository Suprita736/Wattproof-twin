from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from schemas import AdvisorStatus, ChatRequest, ChatResponse
from services.advisor_service import (
    AdvisorError,
    ask_advisor,
    get_model,
    is_configured,
)

router = APIRouter(
    prefix="/api/advisor",
    tags=["AI Advisor"],
)


@router.get("/status", response_model=AdvisorStatus)
def advisor_status():
    """Tell the frontend whether the AI advisor has an API key."""
    return {"configured": is_configured(), "model": get_model()}


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """Answer a question about the saved equipment, diagnosis and passports."""
    try:
        return ask_advisor(db, request.messages)
    except AdvisorError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.detail,
        ) from error