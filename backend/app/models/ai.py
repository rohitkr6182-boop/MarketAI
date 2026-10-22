from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.sql import func

from app.database import Base


class AIConversation(Base):
    __tablename__ = "ai_conversations"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(10), nullable=False)     # user | assistant
    content = Column(Text, nullable=False)
    context_ticker = Column(String(20), nullable=True)
    tools_used = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
