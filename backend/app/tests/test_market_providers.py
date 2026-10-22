from app.core.config import settings
from app.services.providers.mock_provider import MockMarketDataProvider
from app.services.providers.registry import _market_key, _provider_for_key, get_market_data_provider


def test_market_provider_routes_indian_and_us_symbols(monkeypatch):
    monkeypatch.setattr(settings, "INDIA_MARKET_DATA_PROVIDER", "tapetide")
    monkeypatch.setattr(settings, "US_MARKET_DATA_PROVIDER", "alpaca")
    monkeypatch.setattr(settings, "MARKET_DATA_PROVIDER", "mock")

    assert _market_key("TCS") == "tapetide"
    assert _market_key("RELIANCE.NS") == "tapetide"
    assert _market_key("AAPL") == "alpaca"
    assert _market_key("MSFT", region="US") == "alpaca"
    assert _market_key("TCS", region="IN") == "tapetide"


def test_missing_vendor_keys_fall_back_to_mock_provider(monkeypatch):
    monkeypatch.setattr(settings, "INDIA_MARKET_DATA_PROVIDER", "tapetide")
    monkeypatch.setattr(settings, "US_MARKET_DATA_PROVIDER", "alpaca")
    monkeypatch.setattr(settings, "TAPETIDE_API_KEY", "")
    monkeypatch.setattr(settings, "ALPACA_API_KEY", "")
    monkeypatch.setattr(settings, "ALPACA_API_SECRET_KEY", "")
    _provider_for_key.cache_clear()
    try:
        assert isinstance(get_market_data_provider(ticker="TCS"), MockMarketDataProvider)
        assert isinstance(get_market_data_provider(ticker="AAPL"), MockMarketDataProvider)
        assert get_market_data_provider(ticker="TCS").get_quote("TCS")["source"] == "mock"
    finally:
        _provider_for_key.cache_clear()
