from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.database import Base


class Financials(Base):
    __tablename__ = "financials"
    id = Column(Integer, primary_key=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False, index=True)
    period = Column(String(10), nullable=False)      # "annual" | "quarterly"
    fiscal_period = Column(String(20), nullable=False)  # e.g. "FY2025", "Q2FY2025"

    revenue = Column(Float)
    gross_profit = Column(Float)
    operating_income = Column(Float)
    ebitda = Column(Float)
    net_income = Column(Float)
    eps = Column(Float)

    total_assets = Column(Float)
    total_liabilities = Column(Float)
    total_equity = Column(Float)
    cash = Column(Float)
    debt = Column(Float)

    operating_cash_flow = Column(Float)
    investing_cash_flow = Column(Float)
    financing_cash_flow = Column(Float)
    free_cash_flow = Column(Float)

    reported_at = Column(DateTime(timezone=True), server_default=func.now())
