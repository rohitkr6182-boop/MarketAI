"""
Lexicon-based fallback sentiment scorer (deterministic, no ML deps needed
to boot the app). Swap in a real FinBERT/transformers pipeline by
implementing `score(text)` with the same return shape and pointing
services/providers/registry or the news ingestion job at it -- see
docs/AI.md for the drop-in instructions.
"""
POSITIVE_WORDS = {"beats", "expansion", "wins", "raise", "raised", "gain", "gains", "growth", "strong", "record", "upgrade"}
NEGATIVE_WORDS = {"cut", "slide", "slides", "scrutiny", "volatility", "miss", "misses", "downgrade", "weak", "falls", "fell", "lawsuit"}


def score(text: str) -> dict:
    words = set(text.lower().replace(",", "").replace(".", "").split())
    pos = len(words & POSITIVE_WORDS)
    neg = len(words & NEGATIVE_WORDS)
    raw = pos - neg
    if raw > 0:
        label, value = "positive", min(1.0, 0.3 + 0.2 * raw)
    elif raw < 0:
        label, value = "negative", max(-1.0, -0.3 - 0.2 * abs(raw))
    else:
        label, value = "neutral", 0.0
    return {"label": label, "score": round(value, 2), "model_name": "lexicon-fallback"}
