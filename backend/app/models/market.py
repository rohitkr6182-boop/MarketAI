from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Exchange(Base):
    __tablename__ = "exchanges"
    id = Column(Integer, primary_key=True)
    code = Column(String(20), unique=True, nullable=False)   # e.g. NSE, NASDAQ
    name = Column(String(120), nullable=False)
    country = Column(String(80), nullable=False)
    currency = Column(String(10), nullable=False)            # INR, USD


class Sector(Base):
    __tablename__ = "sectors"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), unique=True, nullable=False)


class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True)
    ticker = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    exchange_id = Column(Integer, ForeignKey("exchanges.id"))
    sector_id = Column(Integer, ForeignKey("sectors.id"))
    industry = Column(String(120), nullable=True)
    founded_year = Column(Integer, nullable=True)
    headquarters = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
    ceo = Column(String(255), nullable=True)
    chairperson = Column(String(255), nullable=True)
    employees = Column(Integer, nullable=True)
    description = Column(String(2000), nullable=True)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    exchange = relationship("Exchange")
    sector = relationship("Sector")


class Stock(Base):
    """A tradeable instrument, 1:1 with Company for this project's scope."""
    __tablename__ = "stocks"
    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), unique=True, nullable=False)
    currency = Column(String(10), nullable=False, default="INR")
    is_tradeable = Column(Integer, default=1)  # 1/0 instead of Boolean for simplicity across DBs

    company = relationship("Company")
