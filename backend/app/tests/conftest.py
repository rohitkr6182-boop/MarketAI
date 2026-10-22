import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.core.config import settings
from app.services.providers.registry import _provider_for_key
from app.models.market import Exchange, Sector, Company, Stock
from app.models.trading import PaperAccount


@pytest.fixture()
def db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    from app import models  # noqa: F401
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture()
def tcs_stock(db):
    exch = Exchange(code="NSE", name="NSE", country="India", currency="INR")
    sector = Sector(name="IT Services")
    db.add_all([exch, sector]); db.commit(); db.refresh(exch); db.refresh(sector)
    company = Company(ticker="TCS", name="Tata Consultancy Services", exchange_id=exch.id, sector_id=sector.id)
    db.add(company); db.commit(); db.refresh(company)
    stock = Stock(company_id=company.id, currency="INR")
    db.add(stock); db.commit(); db.refresh(stock)
    return stock


@pytest.fixture()
def inr_account(db):
    acct = PaperAccount(user_id=1, currency="INR", cash_balance=1_000_000)
    db.add(acct); db.commit(); db.refresh(acct)
    return acct


@pytest.fixture(autouse=True)
def use_mock_market_providers_in_tests(monkeypatch):
    """Keep tests deterministic and prevent accidental calls to paid/live APIs."""
    monkeypatch.setattr(settings, "MARKET_DATA_PROVIDER", "mock")
    monkeypatch.setattr(settings, "INDIA_MARKET_DATA_PROVIDER", "mock")
    monkeypatch.setattr(settings, "US_MARKET_DATA_PROVIDER", "mock")
    _provider_for_key.cache_clear()
    yield
    _provider_for_key.cache_clear()
