"""
Provider registry for market data, news, financials, analysts, and FX.
Market quotes/history are selected by region or ticker suffix:
  - India: market=IN / region=IN, or ticker ending in .NS or .BO
  - US: market=US / region=US, or the configured US provider default
"""
from functools import lru_cache

from app.core.config import settings
from app.services.providers.alpaca_provider import AlpacaMarketDataProvider
from app.services.providers.tapetide_provider import TapetideMarketDataProvider
from app.services.providers.mock_provider import (
    MockMarketDataProvider, MockNewsProvider, MockFinancialDataProvider,
    MockAnalystDataProvider, MockFXProvider,
)

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

    if normalized_region in {"IN", "INDIA", "NSE", "BSE"}:
        return settings.INDIA_MARKET_DATA_PROVIDER.lower()
    if normalized_region in {"US", "USA", "NASDAQ", "NYSE"}:
        return settings.US_MARKET_DATA_PROVIDER.lower()
    if normalized_ticker.endswith((".NS", ".BO")):
        return settings.INDIA_MARKET_DATA_PROVIDER.lower()

    # Preserve the old single-provider configuration when explicitly set to
    # something other than mock; otherwise use the US provider by default.
    legacy = (settings.MARKET_DATA_PROVIDER or "mock").lower()
    if legacy != "mock":
        return legacy
    return settings.US_MARKET_DATA_PROVIDER.lower()


@lru_cache
def _provider_for_key(key):
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
    cls = _FIN_MAP.get(settings.MARKET_DATA_PROVIDER, MockFinancialDataProvider)
    return cls()


@lru_cache
def get_analyst_data_provider():
    cls = _ANALYST_MAP.get(settings.MARKET_DATA_PROVIDER, MockAnalystDataProvider)
    return cls()


@lru_cache
def get_fx_provider():
    cls = _FX_MAP.get(settings.FX_PROVIDER, MockFXProvider)
    return cls()
