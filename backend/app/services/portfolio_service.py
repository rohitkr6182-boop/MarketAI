"""
Core paper-trading logic. Kept isolated and dependency-light (plain
functions over a session + ORM objects) specifically so it's easy to unit
test without spinning up the API layer -- see app/tests/test_orders.py.
"""
from sqlalchemy.orm import Session

from app.models.trading import PaperAccount, Holding, Transaction
from app.services.providers.registry import get_market_data_provider


class InsufficientCashError(Exception):
    pass


class InsufficientSharesError(Exception):
    pass


class InvalidOrderError(Exception):
    pass


def get_or_create_account(db: Session, user_id: int, currency: str, default_cash: float) -> PaperAccount:
    acct = db.query(PaperAccount).filter_by(user_id=user_id, currency=currency).first()
    if not acct:
        acct = PaperAccount(user_id=user_id, currency=currency, cash_balance=default_cash)
        db.add(acct)
        db.commit()
        db.refresh(acct)
    return acct


def _current_price(ticker: str) -> float:
    return get_market_data_provider().get_quote(ticker)["price"]


def buy(db: Session, account: PaperAccount, stock_id: int, ticker: str,
        quantity: float | None = None, amount: float | None = None) -> Transaction:
    if not quantity and not amount:
        raise InvalidOrderError("Provide either quantity or amount.")

    price = _current_price(ticker)
    if amount and not quantity:
        quantity = round(amount / price, 6)
    total = round(quantity * price, 2)

    if total > account.cash_balance:
        raise InsufficientCashError(
            f"Order costs {total:.2f} but only {account.cash_balance:.2f} demo cash is available."
        )

    holding = db.query(Holding).filter_by(account_id=account.id, stock_id=stock_id).first()
    if holding:
        new_qty = holding.quantity + quantity
        holding.avg_buy_price = round(
            (holding.avg_buy_price * holding.quantity + price * quantity) / new_qty, 4
        )
        holding.quantity = new_qty
    else:
        holding = Holding(account_id=account.id, stock_id=stock_id, quantity=quantity, avg_buy_price=price)
        db.add(holding)

    account.cash_balance = round(account.cash_balance - total, 2)

    tx = Transaction(account_id=account.id, stock_id=stock_id, side="BUY",
                      quantity=quantity, price=price, amount=total, currency=account.currency)
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


def sell(db: Session, account: PaperAccount, stock_id: int, ticker: str, quantity: float) -> Transaction:
    if quantity <= 0:
        raise InvalidOrderError("Quantity must be positive.")

    holding = db.query(Holding).filter_by(account_id=account.id, stock_id=stock_id).first()
    if not holding or holding.quantity < quantity:
        owned = holding.quantity if holding else 0
        raise InsufficientSharesError(f"Tried to sell {quantity} but only {owned} shares are held.")

    price = _current_price(ticker)
    total = round(quantity * price, 2)

    holding.quantity = round(holding.quantity - quantity, 6)
    if holding.quantity == 0:
        holding.avg_buy_price = 0

    account.cash_balance = round(account.cash_balance + total, 2)

    tx = Transaction(account_id=account.id, stock_id=stock_id, side="SELL",
                      quantity=quantity, price=price, amount=total, currency=account.currency)
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


def portfolio_summary(db: Session, account: PaperAccount) -> dict:
    holdings = db.query(Holding).filter_by(account_id=account.id).all()
    provider = get_market_data_provider()
    rows, invested, market_value = [], 0.0, 0.0

    for h in holdings:
        if h.quantity <= 0:
            continue
        from app.models.market import Stock, Company
        stock = db.query(Stock).filter_by(id=h.stock_id).first()
        company = db.query(Company).filter_by(id=stock.company_id).first()
        price = provider.get_quote(company.ticker)["price"]
        mv = round(price * h.quantity, 2)
        cost = round(h.avg_buy_price * h.quantity, 2)
        invested += cost
        market_value += mv
        rows.append({
            "ticker": company.ticker, "quantity": h.quantity, "avg_buy_price": h.avg_buy_price,
            "current_price": price, "market_value": mv, "pl": round(mv - cost, 2),
            "pl_pct": round((mv - cost) / cost * 100, 2) if cost else 0.0,
        })

    total_value = round(account.cash_balance + market_value, 2)
    return {
        "cash_balance": account.cash_balance, "invested": round(invested, 2),
        "market_value": round(market_value, 2), "total_value": total_value,
        "total_pl": round(market_value - invested, 2),
        "return_pct": round((market_value - invested) / invested * 100, 2) if invested else 0.0,
        "holdings": rows, "currency": account.currency,
    }
