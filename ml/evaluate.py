"""Loads a trained model and produces the explainable-AI factor summary
described in the spec (momentum / volume / technical trend / news
sentiment / market trend / risk) for a single ticker's latest bar."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import joblib
from features import build_features


def explain_latest(ticker: str, model_path: str = "models/trend_model.joblib") -> dict:
    from app.services.providers.registry import get_market_data_provider
    from train import FEATURE_COLS

    bundle = joblib.load(model_path)
    model, features = bundle["model"], bundle["features"]

    history = get_market_data_provider().get_history(ticker, "1Y")
    df = build_features(history)
    latest = df.iloc[[-1]]

    pred = model.predict(latest[features])[0]
    proba = dict(zip(model.classes_, model.predict_proba(latest[features])[0].round(3)))

    row = latest.iloc[0]
    factors = {
        "momentum": "Positive" if row["rsi14"] > 55 else ("Negative" if row["rsi14"] < 45 else "Neutral"),
        "volatility": "Elevated" if row["volatility"] > df["volatility"].median() else "Normal",
        "technical_trend": "Positive" if row["macd"] > row["macd_signal"] else "Negative",
        "news_sentiment": "Positive" if row["news_sentiment"] > 0 else ("Negative" if row["news_sentiment"] < 0 else "Neutral"),
        "market_trend": "Positive" if row["market_change_pct"] >= 0 else "Negative",
    }
    return {"ticker": ticker, "prediction": pred, "class_probabilities": proba, "factors": factors,
            "disclaimer": "Model output based on historical patterns; does not guarantee future performance."}


if __name__ == "__main__":
    import sys as _sys
    print(explain_latest(_sys.argv[1] if len(_sys.argv) > 1 else "TCS"))
