from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from database import Base
from datetime import datetime


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    source = Column(String(100), nullable=False)
    sender_email = Column(String(200), default="alert@distill.io")
    received_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="pending")

    # AI Analysis fields
    ai_summary = Column(Text, nullable=True)
    priority = Column(String(20), nullable=True)
    priority_reason = Column(Text, nullable=True)
    action_steps = Column(Text, nullable=True)
    suggested_reply = Column(Text, nullable=True)
    timeline = Column(String(200), nullable=True)
    deadline = Column(String(200), nullable=True)
    red_flags = Column(Text, nullable=True)
    opportunity_score = Column(Float, nullable=True)
    estimated_value = Column(String(200), nullable=True)
    readiness_check = Column(Text, nullable=True)
