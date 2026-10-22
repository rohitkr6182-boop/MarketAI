"""Alpaca market-data provider for US stocks."""
from datetime import datetime, timedelta, timezone

import httpx

from app.core.config import settings
from app.services.providers.base import MarketDataProvider


class AlpacaMarketDataProvider(MarketDataProvider):
    BASE_URL = "https://data.alpaca.markets"

    def __init__(self):
        self.api_key = settings.ALPACA_API_KEY.strip()
        self.api_secret = settings.ALPACA_API_SECRET_KEY.strip()
        if not self.api_key or not self.api_secret:
            raise RuntimeError(
                "Set ALPACA_API_KEY and ALPACA_API_SECRET_KEY in backend/.env"
            )
        self.headers = {
            "APCA-API-KEY-ID": self.api_key,
            "APCA-API-SECRET-KEY": self.api_secret,
        }

    def _get(self, path, params=None):
        response = httpx.get(
            f"{self.BASE_URL}{path}",
            headers=self.headers,
            params=params,
            timeout=20.0,
        )
        response.raise_for_status()
        return response.json()

    def get_quote(self, ticker: str) -> dict:
        ticker = ticker.strip().upper()
        result = self._get(f"/v2/stocks/{ticker}/quotes/latest", {"feed": "iex"})
        quote = result.get("quote", {})
        price = quote.get("ap") or quote.get("bp")
        if price is None:
            raise ValueError(f"No current quote available for {ticker}")
        return {
            "ticker": ticker,
            "name": ticker,
            "exchange": "US",
            "sector": None,
            "currency": "USD",
            "price": price,
            "prev_close": None,
            "change": None,
            "change_pct": None,
            "day_high": None,
            "day_low": None,
            "week52_high": None,
            "week52_low": None,
            "volume": None,
            "market_cap": None,
            "pe": None,
            "pb": None,
            "eps": None,
            "dividend_yield": None,
            "beta": None,
            "source": "alpaca",
            "last_updated": quote.get("t"),
            "market_status": None,
        }

    def get_history(self, ticker: str, range_key: str) -> list[dict]:
        days = {
            "1D": 1, "1W": 7, "1M": 31, "3M": 93, "6M": 186,
            "1Y": 366, "5Y": 1826, "MAX": 3650,
        }.get(range_key.strip().upper(), 186)
        end = datetime.now(timezone.utc)
        start = end - timedelta(days=days)
        result = self._get(
            f"/v2/stocks/{ticker.strip().upper()}/bars",
            {
                "timeframe": "1Day",
                "start": start.isoformat(),
                "end": end.isoformat(),
                "limit": 10000,
                "sort": "asc",
                "feed": "iex",
            },
        )
        return [
            {
                "date": bar["t"],
                "open": bar["o"],
                "high": bar["h"],
                "low": bar["l"],
                "close": bar["c"],
                "volume": bar["v"],
            }
            for bar in result.get("bars", [])
            if bar.get("c") is not None
        ]

    def get_indices(self, region=None) -> list[dict]:
        return []

    def search(self, query: str) -> list[dict]:
        # Symbol search is not part of this provider's initial implementation.
        return []
