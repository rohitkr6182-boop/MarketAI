# ML — Trend Classification

`ml/features.py` builds a feature table (SMA20, EMA12, RSI14, MACD +
signal, ATR14, rolling volatility, market/sector change %, news
sentiment) from historical bars, using the exact same `technical.py`
module the API and AI tools use — so there is one implementation of every
indicator, not two that can drift apart.

`ml/train.py` trains a `RandomForestClassifier` on UP/DOWN/SIDEWAYS labels
(next-day return thresholded at +/-0.5%), with a **strict time-ordered
split** (no shuffling — the last 20% of rows by date is the test set) so
no future data leaks into training. It prints accuracy/precision/recall/F1
and a confusion matrix, and saves the model with `joblib`.

`ml/evaluate.py` loads a saved model and produces the explainable-AI
factor summary (momentum / volatility / technical trend / news sentiment
/ market trend) for a ticker's latest bar, plus the model's class
probabilities.

**Important caveat**: trained only against the mock provider's synthetic
price history by default. Treat any printed metric as a pipeline sanity
check, not a validated trading signal, until real historical data is
plugged in via a real MarketDataProvider.

Run:
```bash
cd ml
pip install -r requirements.txt -r ../backend/requirements.txt
python train.py --ticker TCS
python evaluate.py TCS
```
