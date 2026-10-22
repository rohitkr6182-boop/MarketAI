"""
Seeds the DB with the demo universe (matches services/providers/mock_provider.UNIVERSE)
and a demo user so the frontend/API can be exercised with zero manual setup.

Run:  python -m database.seed   (from backend/)
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, init_db
from app.models.user import User
from app.models.market import Exchange, Sector, Company, Stock
from app.services.providers.mock_provider import UNIVERSE
from app.core.security import hash_password


def run():
    init_db()
    db = SessionLocal()
    try:
        if not db.query(User).filter_by(email="demo@marketai.local").first():
            db.add(User(email="demo@marketai.local", hashed_password=hash_password("demo1234"),
                         full_name="Demo User"))
            db.commit()

        exchanges = {}
        for ticker, info in UNIVERSE.items():
            code = info["exchange"]
            if code not in exchanges:
                exch = db.query(Exchange).filter_by(code=code).first()
                if not exch:
                    exch = Exchange(code=code, name=code,
                                     country="India" if info["ccy"] == "INR" else "USA",
                                     currency=info["ccy"])
                    db.add(exch); db.commit(); db.refresh(exch)
                exchanges[code] = exch

        sectors = {}
        for ticker, info in UNIVERSE.items():
            name = info["sector"]
            if name not in sectors:
                sec = db.query(Sector).filter_by(name=name).first()
                if not sec:
                    sec = Sector(name=name)
                    db.add(sec); db.commit(); db.refresh(sec)
                sectors[name] = sec

        for ticker, info in UNIVERSE.items():
            if db.query(Company).filter_by(ticker=ticker).first():
                continue
            company = Company(ticker=ticker, name=info["name"],
                               exchange_id=exchanges[info["exchange"]].id,
                               sector_id=sectors[info["sector"]].id)
            db.add(company); db.commit(); db.refresh(company)
            db.add(Stock(company_id=company.id, currency=info["ccy"]))
            db.commit()

        print(f"Seeded {len(UNIVERSE)} companies + demo user (demo@marketai.local / demo1234).")
    finally:
        db.close()


if __name__ == "__main__":
    run()
