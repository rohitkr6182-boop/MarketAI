"""Tapetide provider for Indian stock market quotes and daily history."""
from datetime import date, timedelta
from urllib.parse import quote

import httpx

from app.core.config import settings
from app.services.providers.base import MarketDataProvider


INDIAN_TICKERS = {
    "TCS", "INFY", "RELIANCE", "HDFCBANK", "ICICIBANK",
    "BHARTIARTL", "ITC", "LT", "SBIN", "WIPRO", "AXISBANK",
    "KOTAKBANK", "MARUTI", "TATAMOTORS", "SUNPHARMA", "TITAN",
    "ASIANPAINT", "BAJFINANCE", "HINDUNILVR", "ULTRACEMCO",
}


def _provider_symbol(ticker: str) -> str:
    symbol = ticker.strip().upper()
    if symbol.endswith((".NS", ".BO")):
        return symbol
    if symbol in INDIAN_TICKERS:
        return f"{symbol}.NS"
    return symbol


class TapetideMarketDataProvider(MarketDataProvider):
    BASE_URL = "https://api.tapetide.com/v1"

    def __init__(self):
        self.api_key = settings.TAPETIDE_API_KEY.strip()
        if not self.api_key:
            raise RuntimeError("TAPETIDE_API_KEY is missing from backend/.env")
        self.headers = {"Authorization": f"Bearer {self.api_key}"}

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
        requested_ticker = ticker.strip().upper()
        symbol = _provider_symbol(requested_ticker)
        result = self._get("/quotes/live", params={"symbols": symbol})
        rows = result.get("data", [])
        if not rows or not rows[0].get("found"):
            raise ValueError(f"No Indian stock quote found for {symbol}")
        row = rows[0]
        price = row.get("ltp")
        if price is None:
            raise ValueError(f"No current price available for {symbol}")
        return {
            "ticker": requested_ticker,
            "name": row.get("name") or requested_ticker,
            "exchange": "NSE/BSE",
            "sector": None,
            "currency": "INR",
            "price": price,
            "prev_close": row.get("prev_close"),
            "change": row.get("change"),
            "change_pct": row.get("change_pct"),
            "day_high": row.get("high"),
            "day_low": row.get("low"),
            "week52_high": None,
            "week52_low": None,
            "volume": row.get("volume"),
            "market_cap": None,
            "pe": None,
            "pb": None,
            "eps": None,
            "dividend_yield": None,
            "beta": None,
            "source": "tapetide",
            "last_updated": row.get("last_trade_at"),
            "market_status": row.get("market_status"),
        }

    def get_history(self, ticker: str, range_key: str) -> list[dict]:
        # This provider adapter currently uses daily bars, not intraday bars.
        days = {
            "1D": 1, "1W": 7, "1M": 31, "3M": 93, "6M": 186,
            "1Y": 365, "5Y": 1825, "MAX": 1825,
        }.get(range_key.strip().upper(), 186)
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        symbol = quote(_provider_symbol(ticker), safe="")
        result = self._get(
            f"/stocks/{symbol}/prices/daily",
            params={
                "from": start_date.isoformat(),
                "to": end_date.isoformat(),
                "limit": 5000,
                "order": "asc",
            },
        )
        return [
            {
                "date": bar["date"],
                "open": bar["open"],
                "high": bar["high"],
                "low": bar["low"],
                "close": bar["close"],
                "volume": bar.get("volume"),
            }
            for bar in result.get("data", [])
            if bar.get("close") is not None
        ]

    def get_indices(self, region=None) -> list[dict]:
        return []

    def search(self, query: str) -> list[dict]:
        # Provider-specific symbol search is not wired into this adapter yet.
        return []
