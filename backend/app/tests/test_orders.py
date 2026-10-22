import pytest

from app.services.portfolio_service import (
    buy, sell, portfolio_summary, InsufficientCashError, InsufficientSharesError, InvalidOrderError,
)


def test_buy_by_quantity_updates_cash_and_holding(db, tcs_stock, inr_account):
    tx = buy(db, inr_account, tcs_stock.id, "TCS", quantity=10)
    assert tx.side == "BUY"
    assert tx.quantity == 10
    assert inr_account.cash_balance < 1_000_000


def test_buy_by_amount_computes_quantity(db, tcs_stock, inr_account):
    tx = buy(db, inr_account, tcs_stock.id, "TCS", amount=50_000)
    assert tx.amount <= 50_000 + 0.01
    assert tx.quantity > 0


def test_buy_without_quantity_or_amount_raises(db, tcs_stock, inr_account):
    with pytest.raises(InvalidOrderError):
        buy(db, inr_account, tcs_stock.id, "TCS")


def test_buy_more_than_cash_raises_insufficient_cash(db, tcs_stock, inr_account):
    inr_account.cash_balance = 100
    with pytest.raises(InsufficientCashError):
        buy(db, inr_account, tcs_stock.id, "TCS", quantity=1000)


def test_average_buy_price_recalculated_on_second_buy(db, tcs_stock, inr_account):
    buy(db, inr_account, tcs_stock.id, "TCS", quantity=10)
    buy(db, inr_account, tcs_stock.id, "TCS", quantity=10)
    from app.models.trading import Holding
    holding = db.query(Holding).filter_by(account_id=inr_account.id, stock_id=tcs_stock.id).first()
    assert holding.quantity == 20
    assert holding.avg_buy_price > 0


def test_sell_more_than_owned_raises_insufficient_shares(db, tcs_stock, inr_account):
    buy(db, inr_account, tcs_stock.id, "TCS", quantity=5)
    with pytest.raises(InsufficientSharesError):
        sell(db, inr_account, tcs_stock.id, "TCS", quantity=10)


def test_sell_updates_cash_and_realized_holding(db, tcs_stock, inr_account):
    buy(db, inr_account, tcs_stock.id, "TCS", quantity=10)
    cash_after_buy = inr_account.cash_balance
    sell(db, inr_account, tcs_stock.id, "TCS", quantity=5)
    assert inr_account.cash_balance > cash_after_buy
    from app.models.trading import Holding
    holding = db.query(Holding).filter_by(account_id=inr_account.id, stock_id=tcs_stock.id).first()
    assert holding.quantity == 5


def test_sell_zero_or_negative_quantity_raises(db, tcs_stock, inr_account):
    buy(db, inr_account, tcs_stock.id, "TCS", quantity=5)
    with pytest.raises(InvalidOrderError):
        sell(db, inr_account, tcs_stock.id, "TCS", quantity=0)


def test_portfolio_summary_reflects_holdings(db, tcs_stock, inr_account):
    buy(db, inr_account, tcs_stock.id, "TCS", quantity=10)
    summary = portfolio_summary(db, inr_account)
    assert summary["holdings"][0]["ticker"] == "TCS"
    assert summary["holdings"][0]["quantity"] == 10
    assert summary["total_value"] == pytest.approx(
        summary["cash_balance"] + summary["market_value"], abs=0.01
    )
