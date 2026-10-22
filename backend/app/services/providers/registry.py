"""
Provider registry for market data, news, financials, analysts, and FX.
Bare symbols in the app's Indian-stock universe route to Tapetide; .NS/.BO
symbols also route to Tapetide. US symbols route to Alpaca by default.
"""
from functools import lru_cache

from app.core.config import settings
from app.services.providers.alpaca_provider import AlpacaMarketDataProvider
from app.services.providers.tapetide_provider import TapetideMarketDataProvider
from app.services.providers.mock_provider import (
    MockMarketDataProvider, MockNewsProvider, MockFinancialDataProvider,
    MockAnalystDataProvider, MockFXProvider,
)

INDIAN_TICKERS = {
    "TCS", "INFY", "RELIANCE", "HDFCBANK", "ICICIBANK",
    "BHARTIARTL", "ITC", "LT", "SBIN", "WIPRO", "AXISBANK",
    "KOTAKBANK", "MARUTI", "TATAMOTORS", "SUNPHARMA", "TITAN",
    "ASIANPAINT", "BAJFINANCE", "HINDUNILVR", "ULTRACEMCO",
}

_MARKET_MAP = {
    "mock": MockMarketDataProvider,
    "alpaca": AlpacaMarketDataProvider,
    "tapetide": TapetideMarketDataProvider,
}
_NEWS_MAP = {"mock": MockNewsProvider}
_FIN_MAP = {"mock": MockFinancialDataProvider}
_ANALYST_MAP = {"mock": MockAnalystDataProvider}
_FX_MAP = {"mock": MockFXProvider}


def _market_key(ticker=None, region=None):
    normalized_region = (region or "").strip().upper()
    normalized_ticker = (ticker or "").strip().upper()
    base_ticker = normalized_ticker.split(".")[0]

    if normalized_region in {"IN", "INDIA", "NSE", "BSE"}:
        return settings.INDIA_MARKET_DATA_PROVIDER.lower()
    if normalized_region in {"US", "USA", "NASDAQ", "NYSE"}:
        return settings.US_MARKET_DATA_PROVIDER.lower()
    if normalized_ticker.endswith((".NS", ".BO")) or base_ticker in INDIAN_TICKERS:
        return settings.INDIA_MARKET_DATA_PROVIDER.lower()

    # A legacy MARKET_DATA_PROVIDER in an old .env must not override the
    # separate India/US provider settings. Honor it only when both regional
    # settings are still the mock defaults (legacy single-provider setup).
    india_provider = settings.INDIA_MARKET_DATA_PROVIDER.lower()
    us_provider = settings.US_MARKET_DATA_PROVIDER.lower()
    if india_provider != "mock" or us_provider != "mock":
        return us_provider
    legacy = (getattr(settings, "MARKET_DATA_PROVIDER", "mock") or "mock").lower()
    return legacy if legacy else "mock"


@lru_cache
def _provider_for_key(key):
    # Keep the app and its test suite runnable without vendor credentials.
    # The mock provider labels its responses with source="mock", so fallback
    # data is not silently presented as live market data.
    if key == "tapetide" and not settings.TAPETIDE_API_KEY.strip():
        return MockMarketDataProvider()
    if key == "alpaca" and not (
        settings.ALPACA_API_KEY.strip() and settings.ALPACA_API_SECRET_KEY.strip()
    ):
        return MockMarketDataProvider()
    cls = _MARKET_MAP.get(key, MockMarketDataProvider)
    return cls()


def get_market_data_provider(ticker=None, region=None):
    """Return the configured provider for a ticker or market region."""
    return _provider_for_key(_market_key(ticker=ticker, region=region))


@lru_cache
def get_news_provider():
    cls = _NEWS_MAP.get(settings.NEWS_PROVIDER, MockNewsProvider)
    return cls()


@lru_cache
def get_financial_data_provider():
    key = getattr(settings, "MARKET_DATA_PROVIDER", "mock")
    cls = _FIN_MAP.get(key, MockFinancialDataProvider)
    return cls()


@lru_cache
def get_analyst_data_provider():
    key = getattr(settings, "MARKET_DATA_PROVIDER", "mock")
    cls = _ANALYST_MAP.get(key, MockAnalystDataProvider)
    return cls()


@lru_cache
def get_fx_provider():
    cls = _FX_MAP.get(settings.FX_PROVIDER, MockFXProvider)
    return cls()
