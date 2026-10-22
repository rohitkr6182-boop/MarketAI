from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.market import Company, Stock
from app.core.config import settings
from app.schemas.trading import OrderRequest, SellRequest
from app.services.portfolio_service import (
    get_or_create_account, buy, sell,
    InsufficientCashError, InsufficientSharesError, InvalidOrderError,
)

router = APIRouter(prefix="/api/orders", tags=["orders"])


def _resolve_stock(db: Session, ticker: str) -> Stock:
    company = db.query(Company).filter_by(ticker=ticker.upper()).first()
    if not company:
        raise HTTPException(status_code=404, detail=f"Unknown ticker {ticker}. Run database/seed.py first.")
    stock = db.query(Stock).filter_by(company_id=company.id).first()
    if not stock:
        raise HTTPException(status_code=404, detail=f"{ticker} is not set up as a tradeable stock.")
    return stock


def _default_cash(currency: str) -> float:
    return settings.DEFAULT_USD_DEMO_CASH if currency == "USD" else settings.DEFAULT_INR_DEMO_CASH


@router.post("/buy")
def place_buy(payload: OrderRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    stock = _resolve_stock(db, payload.ticker)
    account = get_or_create_account(db, user.id, payload.currency, _default_cash(payload.currency))
    try:
        tx = buy(db, account, stock.id, payload.ticker, payload.quantity, payload.amount)
    except (InsufficientCashError, InvalidOrderError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"transaction_id": tx.id, "side": tx.side, "quantity": tx.quantity, "price": tx.price, "amount": tx.amount}


@router.post("/sell")
def place_sell(payload: SellRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    stock = _resolve_stock(db, payload.ticker)
    account = get_or_create_account(db, user.id, payload.currency, _default_cash(payload.currency))
    try:
        tx = sell(db, account, stock.id, payload.ticker, payload.quantity)
    except (InsufficientSharesError, InvalidOrderError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"transaction_id": tx.id, "side": tx.side, "quantity": tx.quantity, "price": tx.price, "amount": tx.amount}
