from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.market import Company
from app.models.watchlist import Watchlist, WatchlistStock
from app.schemas.trading import WatchlistAdd
from app.services.providers.registry import get_market_data_provider

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


def _get_or_create_watchlist(db: Session, user_id: int) -> Watchlist:
    wl = db.query(Watchlist).filter_by(user_id=user_id).first()
    if not wl:
        wl = Watchlist(user_id=user_id)
        db.add(wl); db.commit(); db.refresh(wl)
    return wl


@router.get("")
def list_watchlist(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    wl = _get_or_create_watchlist(db, user.id)
    items = db.query(WatchlistStock).filter_by(watchlist_id=wl.id).all()
    provider = get_market_data_provider()
    out = []
    for item in items:
        from app.models.market import Stock
        stock = db.query(Stock).filter_by(id=item.stock_id).first()
        company = db.query(Company).filter_by(id=stock.company_id).first()
        out.append(provider.get_quote(company.ticker))
    return out


@router.post("")
def add_to_watchlist(payload: WatchlistAdd, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    company = db.query(Company).filter_by(ticker=payload.ticker.upper()).first()
    if not company:
        raise HTTPException(status_code=404, detail="Unknown ticker")
    from app.models.market import Stock
    stock = db.query(Stock).filter_by(company_id=company.id).first()
    wl = _get_or_create_watchlist(db, user.id)
    exists = db.query(WatchlistStock).filter_by(watchlist_id=wl.id, stock_id=stock.id).first()
    if not exists:
        db.add(WatchlistStock(watchlist_id=wl.id, stock_id=stock.id))
        db.commit()
    return {"status": "added", "ticker": payload.ticker.upper()}


@router.delete("/{ticker}")
def remove_from_watchlist(ticker: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    company = db.query(Company).filter_by(ticker=ticker.upper()).first()
    if not company:
        raise HTTPException(status_code=404, detail="Unknown ticker")
    from app.models.market import Stock
    stock = db.query(Stock).filter_by(company_id=company.id).first()
    wl = _get_or_create_watchlist(db, user.id)
    db.query(WatchlistStock).filter_by(watchlist_id=wl.id, stock_id=stock.id).delete()
    db.commit()
    return {"status": "removed", "ticker": ticker.upper()}
