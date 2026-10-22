from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.market import Company, Stock
from app.models.alerts import Alert
from app.schemas.trading import AlertCreate

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("")
def list_alerts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Alert).filter_by(user_id=user.id).all()


@router.post("")
def create_alert(payload: AlertCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    company = db.query(Company).filter_by(ticker=payload.ticker.upper()).first()
    if not company:
        raise HTTPException(status_code=404, detail="Unknown ticker")
    stock = db.query(Stock).filter_by(company_id=company.id).first()
    if not stock:
        raise HTTPException(status_code=400, detail="This company is not set up for alerts yet.")
    alert = Alert(user_id=user.id, stock_id=stock.id, alert_type=payload.alert_type,
                  threshold=payload.threshold, direction=payload.direction)
    db.add(alert); db.commit(); db.refresh(alert)
    return alert


@router.delete("/{alert_id}")
def delete_alert(alert_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.query(Alert).filter_by(id=alert_id, user_id=user.id).delete()
    db.commit()
    return {"status": "deleted"}
