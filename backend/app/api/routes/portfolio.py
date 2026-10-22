import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.trading import Transaction, PaperAccount
from app.core.config import settings
from app.services.portfolio_service import get_or_create_account, portfolio_summary

router = APIRouter(prefix="/api", tags=["portfolio"])


def _default_cash(currency: str) -> float:
    return settings.DEFAULT_USD_DEMO_CASH if currency == "USD" else settings.DEFAULT_INR_DEMO_CASH


@router.get("/portfolio")
def get_portfolio(currency: str = Query(default="INR"), db: Session = Depends(get_db),
                   user: User = Depends(get_current_user)):
    account = get_or_create_account(db, user.id, currency, _default_cash(currency))
    try:
        return portfolio_summary(db, account)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Could not refresh portfolio prices from the market-data provider.")


@router.get("/transactions")
def get_transactions(currency: str = Query(default="INR"), db: Session = Depends(get_db),
                      user: User = Depends(get_current_user)):
    account = get_or_create_account(db, user.id, currency, _default_cash(currency))
    txs = db.query(Transaction).filter_by(account_id=account.id).order_by(Transaction.executed_at.desc()).all()
    return [
        {"id": t.id, "stock_id": t.stock_id, "side": t.side, "quantity": t.quantity,
         "price": t.price, "amount": t.amount, "currency": t.currency,
         "executed_at": t.executed_at.isoformat() if t.executed_at else None}
        for t in txs
    ]
