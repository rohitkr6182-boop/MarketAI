"""
Trains a trend-direction classifier (UP/DOWN/SIDEWAYS) with a strict,
time-ordered train/test split -- never shuffled, so no future data leaks
into training, per the spec's requirement.

Run (from ml/, after `pip install -r requirements.txt -r ../backend/requirements.txt`):
    python train.py --ticker TCS

Note: with only the mock provider's ~5 years of synthetic daily bars, this
is a small dataset -- treat any reported metric as illustrative of the
pipeline, not as a validated trading signal. Swap in real historical data
(via a real MarketDataProvider) before drawing any conclusion from it.
"""
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from sklearn.model_selection import train_test_split  # noqa (kept for reference; not used -- see split below)
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix
import joblib

from features import build_features

FEATURE_COLS = ["sma20", "ema12", "rsi14", "macd", "macd_signal", "atr14", "volatility",
                 "market_change_pct", "sector_change_pct", "news_sentiment"]


def time_ordered_split(df, test_frac=0.2):
    split_idx = int(len(df) * (1 - test_frac))
    return df.iloc[:split_idx], df.iloc[split_idx:]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--ticker", default="TCS")
    parser.add_argument("--range", default="5Y")
    parser.add_argument("--out", default="models/trend_model.joblib")
    args = parser.parse_args()

    from app.services.providers.registry import get_market_data_provider
    history = get_market_data_provider().get_history(args.ticker, args.range)
    df = build_features(history)

    train_df, test_df = time_ordered_split(df)
    X_train, y_train = train_df[FEATURE_COLS], train_df["label"]
    X_test, y_test = test_df[FEATURE_COLS], test_df["label"]

    model = RandomForestClassifier(n_estimators=200, max_depth=6, random_state=42)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    acc = accuracy_score(y_test, preds)
    precision, recall, f1, _ = precision_recall_fscore_support(y_test, preds, average="weighted", zero_division=0)
    cm = confusion_matrix(y_test, preds, labels=["UP", "DOWN", "SIDEWAYS"]).tolist()

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    joblib.dump({"model": model, "features": FEATURE_COLS}, args.out)

    report = {
        "ticker": args.ticker, "train_rows": len(train_df), "test_rows": len(test_df),
        "accuracy": round(acc, 4), "precision": round(precision, 4),
        "recall": round(recall, 4), "f1": round(f1, 4),
        "confusion_matrix": {"labels": ["UP", "DOWN", "SIDEWAYS"], "matrix": cm},
        "note": "Illustrative only -- trained on synthetic mock price history, time-ordered split, no future leakage.",
    }
    print(json.dumps(report, indent=2))
    return report


if __name__ == "__main__":
    main()
