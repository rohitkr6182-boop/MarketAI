"""
The tool layer the spec calls for: user question -> intent -> tool call ->
real retrieved data -> (LLM or rule-based) response. Every tool here talks
only to providers/services, never to the LLM, so the numbers the chatbot
uses are always the same numbers the REST API would return -- never invented.
"""
from sqlalchemy.orm import Session

from app.services.providers.registry import (
    get_market_data_provider, get_news_provider, get_financial_data_provider,
    get_analyst_data_provider,
)
from app.services import technical
from app.services.portfolio_service import portfolio_summary, get_or_create_account


def get_stock_quote(ticker: str) -> dict:
    return get_market_data_provider().get_quote(ticker)


def get_historical_prices(ticker: str, range_key: str = "6M") -> list[dict]:
    return get_market_data_provider().get_history(ticker, range_key)


def get_company_profile(ticker: str) -> dict:
    return get_financial_data_provider().get_company_profile(ticker)


def get_financials(ticker: str, period: str = "annual") -> list[dict]:
    return get_financial_data_provider().get_financials(ticker, period)


def get_company_news(ticker: str) -> list[dict]:
    return get_news_provider().get_company_news(ticker)


def get_market_indices(region: str | None = None) -> list[dict]:
    return get_market_data_provider().get_indices(region)


def get_sector_data(ticker: str) -> dict:
    quote = get_market_data_provider().get_quote(ticker)
    return {"sector": quote["sector"]}


def get_analyst_ratings(ticker: str) -> dict | None:
    return get_analyst_data_provider().get_ratings(ticker)


def calculate_technical_indicators(ticker: str) -> dict:
    hist = get_historical_prices(ticker, "6M")
    closes = [h["close"] for h in hist]
    highs = [h["high"] for h in hist]
    lows = [h["low"] for h in hist]
    return {
        "rsi": technical.rsi(closes)[-1],
        "sma20": technical.sma(closes, 20)[-1],
        "sma50": technical.sma(closes, 50)[-1],
        "ema12": technical.ema(closes, 12)[-1],
        "macd": technical.macd(closes)["macd"][-1],
        "bollinger": {k: v[-1] for k, v in technical.bollinger(closes).items()},
        "atr": technical.atr(highs, lows, closes)[-1],
    }


def get_portfolio(db: Session, user_id: int, currency: str, default_cash: float) -> dict:
    account = get_or_create_account(db, user_id, currency, default_cash)
    return portfolio_summary(db, account)


TOOL_REGISTRY = {
    "get_stock_quote": get_stock_quote,
    "get_historical_prices": get_historical_prices,
    "get_company_profile": get_company_profile,
    "get_financials": get_financials,
    "get_company_news": get_company_news,
    "get_market_indices": get_market_indices,
    "get_sector_data": get_sector_data,
    "get_analyst_ratings": get_analyst_ratings,
    "calculate_technical_indicators": calculate_technical_indicators,
}
