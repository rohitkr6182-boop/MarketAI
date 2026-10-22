from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.database import Base


class PaperAccount(Base):
    __tablename__ = "paper_accounts"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    currency = Column(String(10), nullable=False)   # INR | USD
    cash_balance = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Holding(Base):
    __tablename__ = "holdings"
    id = Column(Integer, primary_key=True)
    account_id = Column(Integer, ForeignKey("paper_accounts.id"), nullable=False)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)
    quantity = Column(Float, nullable=False, default=0)
    avg_buy_price = Column(Float, nullable=False, default=0)


class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True)
    account_id = Column(Integer, ForeignKey("paper_accounts.id"), nullable=False)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)
    side = Column(String(4), nullable=False)   # BUY | SELL
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), nullable=False)
    executed_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
