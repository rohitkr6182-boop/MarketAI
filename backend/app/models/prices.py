from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, BigInteger
from sqlalchemy.sql import func

from app.database import Base


class MarketData(Base):
    """Latest quote snapshot per stock (upserted on each refresh)."""
    __tablename__ = "market_data"
    id = Column(Integer, primary_key=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), unique=True, nullable=False)
    price = Column(Float, nullable=False)
    open = Column(Float)
    prev_close = Column(Float)
    day_high = Column(Float)
    day_low = Column(Float)
    week52_high = Column(Float)
    week52_low = Column(Float)
    volume = Column(BigInteger)
    avg_volume = Column(BigInteger)
    market_cap = Column(Float)
    pe = Column(Float)
    pb = Column(Float)
    eps = Column(Float)
    dividend_yield = Column(Float)
    beta = Column(Float)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class HistoricalPrice(Base):
    __tablename__ = "historical_prices"
    id = Column(Integer, primary_key=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False, index=True)
    date = Column(DateTime(timezone=True), nullable=False, index=True)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(BigInteger, nullable=False)
