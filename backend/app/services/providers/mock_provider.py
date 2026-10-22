"""
Deterministic, clearly-labeled mock providers so the app is fully runnable
with zero API keys. Every payload includes `"source": "mock"` so the
frontend can render a "Demo data" badge per the project's data-honesty rule.

Swap this out by setting MARKET_DATA_PROVIDER / NEWS_PROVIDER etc. in .env
and adding a real implementation in this package that satisfies the same
base.py interfaces -- registry.py picks it up automatically.
"""
import hashlib
import math
import random
from datetime import datetime, timedelta

from app.services.providers.base import (
    MarketDataProvider, NewsProvider, FinancialDataProvider,
    AnalystDataProvider, FXProvider,
)

UNIVERSE = {
    "TCS": {"name": "Tata Consultancy Services", "exchange": "NSE", "sector": "IT Services", "ccy": "INR", "base": 3950},
    "INFY": {"name": "Infosys Ltd", "exchange": "NSE", "sector": "IT Services", "ccy": "INR", "base": 1620},
    "RELIANCE": {"name": "Reliance Industries", "exchange": "NSE", "sector": "Energy", "ccy": "INR", "base": 2870},
    "HDFCBANK": {"name": "HDFC Bank", "exchange": "NSE", "sector": "Banking", "ccy": "INR", "base": 1690},
    "AAPL": {"name": "Apple Inc.", "exchange": "NASDAQ", "sector": "Technology", "ccy": "USD", "base": 228},
    "MSFT": {"name": "Microsoft Corp.", "exchange": "NASDAQ", "sector": "Technology", "ccy": "USD", "base": 430},
    "NVDA": {"name": "NVIDIA Corp.", "exchange": "NASDAQ", "sector": "Technology", "ccy": "USD", "base": 118},
    "GOOGL": {"name": "Alphabet Inc.", "exchange": "NASDAQ", "sector": "Technology", "ccy": "USD", "base": 172},
}

INDICES = {
    "NIFTY50": {"name": "NIFTY 50", "base": 24800, "region": "india"},
    "SENSEX": {"name": "SENSEX", "base": 81500, "region": "india"},
    "BANKNIFTY": {"name": "BANK NIFTY", "base": 51200, "region": "india"},
    "NASDAQ": {"name": "NASDAQ Composite", "base": 18400, "region": "us"},
    "SPX": {"name": "S&P 500", "base": 5700, "region": "us"},
    "DJI": {"name": "Dow Jones", "base": 41200, "region": "us"},
}


def _seed(key: str) -> random.Random:
    h = int(hashlib.sha256(key.encode()).hexdigest(), 16) % (2**32)
    return random.Random(h)


def _walk(base: float, n: int, vol: float, seed_key: str) -> list[float]:
    rnd = _seed(seed_key)
    vals, price = [], base
    for i in range(n):
        drift = math.sin(i / 17.0) * vol * 0.3
        price *= 1 + rnd.gauss(0, vol) + drift * 0.01
        price = max(price, 0.5)
        vals.append(round(price, 2))
    return vals


class MockMarketDataProvider(MarketDataProvider):
    def get_quote(self, ticker: str) -> dict:
        ticker = ticker.upper()
        info = UNIVERSE.get(ticker)
        if not info:
            raise ValueError(f"Unknown ticker: {ticker}")
        hist = _walk(info["base"], 260, 0.018, ticker)
        price, prev = hist[-1], hist[-2]
        return {
            "ticker": ticker, "name": info["name"], "exchange": info["exchange"],
            "sector": info["sector"], "currency": info["ccy"],
            "price": price, "prev_close": prev,
            "change": round(price - prev, 2),
            "change_pct": round((price - prev) / prev * 100, 2),
            "day_high": round(max(hist[-5:]) * 1.004, 2),
            "day_low": round(min(hist[-5:]) * 0.996, 2),
            "week52_high": round(max(hist), 2),
            "week52_low": round(min(hist), 2),
            "volume": _seed(ticker + "vol").randint(500_000, 8_000_000),
            "market_cap": round(price * _seed(ticker + "shares").randint(200_000_000, 4_000_000_000), 0),
            "pe": round(_seed(ticker + "pe").uniform(12, 45), 1),
            "pb": round(_seed(ticker + "pb").uniform(1.5, 12), 1),
            "eps": round(price / _seed(ticker + "pe").uniform(12, 45), 2),
            "dividend_yield": round(_seed(ticker + "div").uniform(0, 2.5), 2),
            "beta": round(_seed(ticker + "beta").uniform(0.6, 1.8), 2),
            "source": "mock",
        }

    def get_history(self, ticker: str, range_key: str) -> list[dict]:
        info = UNIVERSE.get(ticker.upper())
        if not info:
            raise ValueError(f"Unknown ticker: {ticker}")
        points = {"1D": 1, "1W": 7, "1M": 22, "6M": 130, "1Y": 252, "5Y": 1260, "MAX": 1500}.get(range_key, 130)
        closes = _walk(info["base"], points, 0.018, ticker.upper())
        out, today = [], datetime.utcnow()
        for i, c in enumerate(closes):
            o = closes[i - 1] if i > 0 else c
            out.append({
                "date": (today - timedelta(days=points - i)).isoformat(),
                "open": round(o, 2), "high": round(max(o, c) * 1.006, 2),
                "low": round(min(o, c) * 0.994, 2), "close": c,
                "volume": _seed(f"{ticker}vol{i}").randint(300_000, 6_000_000),
            })
        return out

    def get_indices(self, region=None):
        out = []
        for key, info in INDICES.items():
            if region and info["region"] != region:
                continue
            hist = _walk(info["base"], 30, 0.008, key)
            price, prev = hist[-1], hist[-2]
            out.append({
                "key": key, "name": info["name"], "value": price,
                "change": round(price - prev, 2),
                "change_pct": round((price - prev) / prev * 100, 2),
                "sparkline": hist[-14:], "source": "mock",
            })
        return out

    def search(self, query: str):
        q = query.strip().upper()
        return [
            {"ticker": t, "name": i["name"], "exchange": i["exchange"], "sector": i["sector"]}
            for t, i in UNIVERSE.items() if q in t or q in i["name"].upper()
        ]


class MockNewsProvider(NewsProvider):
    _HEADLINES = [
        ("{t} announces expansion into new markets", "positive"),
        ("{t} beats quarterly earnings estimates", "positive"),
        ("{t} wins large multi-year contract", "positive"),
        ("Analysts raise price target on {t}", "positive"),
        ("{t} flat as investors await earnings", "neutral"),
        ("{sector} sector sees mixed trading", "neutral"),
        ("{t} faces regulatory scrutiny over practices", "negative"),
        ("{t} shares slide after guidance cut", "negative"),
        ("Global market volatility weighs on {sector} stocks", "negative"),
    ]

    def get_market_news(self, limit=30):
        rnd = random.Random(42)
        items, now = [], datetime.utcnow()
        tickers = list(UNIVERSE.items())
        for i in range(limit):
            t, info = rnd.choice(tickers)
            tmpl, sentiment = rnd.choice(self._HEADLINES)
            items.append({
                "id": i, "headline": tmpl.format(t=t, sector=info["sector"]),
                "source": rnd.choice(["Reuters", "Bloomberg", "Moneycontrol", "CNBC"]),
                "ticker": t, "sector": info["sector"], "sentiment": sentiment,
                "published_at": (now - timedelta(minutes=i * 7)).isoformat(),
                "source_type": "mock",
            })
        return items

    def get_company_news(self, ticker, limit=20):
        return [n for n in self.get_market_news(60) if n["ticker"] == ticker.upper()][:limit]


class MockFinancialDataProvider(FinancialDataProvider):
    def get_company_profile(self, ticker: str) -> dict:
        info = UNIVERSE.get(ticker.upper())
        if not info:
            raise ValueError(f"Unknown ticker: {ticker}")
        rnd = _seed(ticker + "profile")
        return {
            "ticker": ticker.upper(), "name": info["name"], "exchange": info["exchange"],
            "sector": info["sector"], "industry": info["sector"],
            "founded_year": rnd.randint(1945, 2005),
            "headquarters": "Mumbai, India" if info["ccy"] == "INR" else "California, USA",
            "website": f"https://www.{ticker.lower()}.com",
            "ceo": "Demo Chief Executive", "chairperson": "Demo Chairperson",
            "employees": rnd.randint(20_000, 600_000),
            "description": f"{info['name']} operates in the {info['sector']} sector. "
                            f"(Demo description -- replace with a real company-data provider.)",
            "last_updated": datetime.utcnow().isoformat(), "source": "mock",
        }

    def get_financials(self, ticker: str, period: str = "annual") -> list[dict]:
        info = UNIVERSE.get(ticker.upper())
        if not info:
            raise ValueError(f"Unknown ticker: {ticker}")
        rnd = _seed(ticker + "fin" + period)
        n = 5 if period == "annual" else 8
        base_rev = rnd.uniform(5e9, 8e10)
        out = []
        for i in range(n):
            rev = base_rev * (1.08 ** i) * rnd.uniform(0.95, 1.05)
            out.append({
                "fiscal_period": f"FY{2021 + i}" if period == "annual" else f"Q{i % 4 + 1}FY{2023 + i // 4}",
                "revenue": round(rev, 0),
                "gross_profit": round(rev * rnd.uniform(0.35, 0.55), 0),
                "operating_income": round(rev * rnd.uniform(0.18, 0.28), 0),
                "ebitda": round(rev * rnd.uniform(0.22, 0.32), 0),
                "net_income": round(rev * rnd.uniform(0.12, 0.2), 0),
                "eps": round(rnd.uniform(20, 120), 2),
                "total_assets": round(rev * rnd.uniform(1.2, 2.0), 0),
                "total_liabilities": round(rev * rnd.uniform(0.5, 0.9), 0),
                "total_equity": round(rev * rnd.uniform(0.6, 1.1), 0),
                "cash": round(rev * rnd.uniform(0.1, 0.3), 0),
                "debt": round(rev * rnd.uniform(0.05, 0.25), 0),
                "operating_cash_flow": round(rev * rnd.uniform(0.15, 0.25), 0),
                "investing_cash_flow": round(-rev * rnd.uniform(0.05, 0.15), 0),
                "financing_cash_flow": round(-rev * rnd.uniform(0.03, 0.1), 0),
                "free_cash_flow": round(rev * rnd.uniform(0.1, 0.2), 0),
            })
        return out


class MockAnalystDataProvider(AnalystDataProvider):
    def get_ratings(self, ticker: str):
        info = UNIVERSE.get(ticker.upper())
        if not info:
            return None
        rnd = _seed(ticker + "analyst")
        price = MockMarketDataProvider().get_quote(ticker)["price"]
        return {
            "buy": rnd.randint(8, 25), "hold": rnd.randint(2, 12), "sell": rnd.randint(0, 5),
            "target_low": round(price * rnd.uniform(0.85, 0.95), 2),
            "target_avg": round(price * rnd.uniform(1.02, 1.15), 2),
            "target_high": round(price * rnd.uniform(1.15, 1.35), 2),
            "label": "External analyst opinion (demo)", "source": "mock",
        }


class MockFXProvider(FXProvider):
    _RATES = {("USD", "INR"): 83.4, ("INR", "USD"): 1 / 83.4}

    def get_rate(self, base: str, quote: str) -> float:
        if base == quote:
            return 1.0
        return self._RATES.get((base, quote), 1.0)
