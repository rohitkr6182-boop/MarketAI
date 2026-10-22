import httpx
import pytest
from fastapi import HTTPException

from app.api.routes import stocks


class BrokenHistoryProvider:
    def get_history(self, ticker, range_key):
        raise httpx.ConnectError("provider unreachable")


def test_history_provider_network_error_returns_502(monkeypatch):
    monkeypatch.setattr(
        stocks,
        "get_market_data_provider",
        lambda ticker=None: BrokenHistoryProvider(),
    )

    with pytest.raises(HTTPException) as error:
        stocks.stock_history("TCS", "6M")

    assert error.value.status_code == 502
    assert "historical prices" in error.value.detail.lower()


def test_technical_provider_network_error_returns_502(monkeypatch):
    monkeypatch.setattr(
        stocks,
        "get_market_data_provider",
        lambda ticker=None: BrokenHistoryProvider(),
    )

    with pytest.raises(HTTPException) as error:
        stocks.stock_technical("TCS", "6M")

    assert error.value.status_code == 502
    assert "technical analysis" in error.value.detail.lower()
