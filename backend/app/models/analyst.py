from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.database import Base


class AnalystRating(Base):
    __tablename__ = "analyst_ratings"
    id = Column(Integer, primary_key=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), unique=True, nullable=False)
    buy_count = Column(Integer, default=0)
    hold_count = Column(Integer, default=0)
    sell_count = Column(Integer, default=0)
    target_low = Column(Float)
    target_avg = Column(Float)
    target_high = Column(Float)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
