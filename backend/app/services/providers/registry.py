"""
Single place that decides which concrete provider implementation to use.
Everything else in the app calls get_market_data_provider() etc. -- never
imports MockMarketDataProvider or a real vendor SDK directly.

To add a real provider:
  1. Implement the relevant base.py interface in a new file, e.g.
     providers/twelvedata_provider.py -> class TwelveDataMarketDataProvider.
  2. Register it in the *_MAP dict below.
  3. Set MARKET_DATA_PROVIDER=twelvedata and MARKET_DATA_API_KEY=... in .env.
No other code changes needed.
"""
from functools import lru_cache

from app.core.config import settings
from app.services.providers.mock_provider import (
    MockMarketDataProvider, MockNewsProvider, MockFinancialDataProvider,
    MockAnalystDataProvider, MockFXProvider,
)

_MARKET_MAP = {"mock": MockMarketDataProvider}
_NEWS_MAP = {"mock": MockNewsProvider}
_FIN_MAP = {"mock": MockFinancialDataProvider}
_ANALYST_MAP = {"mock": MockAnalystDataProvider}
_FX_MAP = {"mock": MockFXProvider}


@lru_cache
def get_market_data_provider():
    cls = _MARKET_MAP.get(settings.MARKET_DATA_PROVIDER, MockMarketDataProvider)
    return cls()


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
