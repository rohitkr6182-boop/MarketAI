"""
Builds the ML feature table described in the spec (Open/High/Low/Close/Volume,
SMA/EMA/RSI/MACD/Volatility, market/sector movement, news sentiment) from
historical price rows. Import the *same* technical.py used by the API so
training-time and serving-time indicator math can never drift apart.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import pandas as pd
import numpy as np
from app.services import technical


def build_features(history: list[dict], market_change_pct: float = 0.0,
                    sector_change_pct: float = 0.0, news_sentiment_score: float = 0.0) -> pd.DataFrame:
    df = pd.DataFrame(history)
    closes = df["close"].tolist()
    highs, lows = df["high"].tolist(), df["low"].tolist()

    df["sma20"] = technical.sma(closes, 20)
    df["ema12"] = technical.ema(closes, 12)
    df["rsi14"] = technical.rsi(closes)
    macd = technical.macd(closes)
    df["macd"] = macd["macd"]
    df["macd_signal"] = macd["signal"]
    df["atr14"] = technical.atr(highs, lows, closes)
    df["volatility"] = df["close"].pct_change().rolling(10).std()
    df["market_change_pct"] = market_change_pct
    df["sector_change_pct"] = sector_change_pct
    df["news_sentiment"] = news_sentiment_score

    # Label: next-day direction relative to a no-trade-cost-adjusted threshold band.
    df["next_close"] = df["close"].shift(-1)
    df["future_return"] = (df["next_close"] - df["close"]) / df["close"]
    df["label"] = np.select(
        [df["future_return"] > 0.005, df["future_return"] < -0.005],
        ["UP", "DOWN"], default="SIDEWAYS",
    )
    return df.dropna(subset=["sma20", "rsi14", "macd", "next_close"])
