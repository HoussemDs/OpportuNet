from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class MessageCreate(BaseModel):
    subject: str
    content: str
    source: str
    sender_email: str = "alert@distill.io"


class MessageResponse(BaseModel):
    id: int
    subject: str
    content: str
    source: str
    sender_email: str
    received_at: datetime
    status: str
    ai_summary: Optional[str] = None
    priority: Optional[str] = None
    priority_reason: Optional[str] = None
    action_steps: Optional[str] = None
    suggested_reply: Optional[str] = None
    timeline: Optional[str] = None
    deadline: Optional[str] = None
    red_flags: Optional[str] = None
    opportunity_score: Optional[float] = None
    estimated_value: Optional[str] = None
    readiness_check: Optional[str] = None

    class Config:
        from_attributes = True
