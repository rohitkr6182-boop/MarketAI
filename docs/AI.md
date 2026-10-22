# AI Chatbot

## Current mode: rule-based tool routing (LLM_PROVIDER=none)
`chat_service.answer()` regex-matches the user's message for a known
ticker (falling back to `context_ticker` when the user says "it"/"this
stock"), then keyword-matches intent (portfolio / market / news /
financials / technicals / "why is it moving" / default quote), calls the
matching function(s) in `services/ai/tools.py`, and fills a template with
the real returned data. This is fully functional with zero external API
calls or cost, and is what ships by default.

## Upgrading to a real LLM (LLM_PROVIDER=anthropic)
1. `pip install anthropic`.
2. In `chat_service.py`, after computing `used_tools`/retrieved data (or
   instead of hand-rolled intent detection — let the model choose tools),
   call the Anthropic Messages API with tool-use, exposing the functions
   in `TOOL_REGISTRY` (tools.py) as tool definitions.
3. **Critical constraint to preserve**: the model must never emit a price,
   headline, or financial figure that didn't come from a tool result.
   Keep tool execution server-side (never trust the model to "recall" a
   number), and consider a citation-style check that every number in the
   final reply appears somewhere in the tool outputs before returning it.
4. Keep `context_ticker` — when the user is on a company page and says
   "why is it falling", pass the current ticker as `context_ticker` in the
   request body so pronoun resolution works without an LLM call.

## Sentiment model
`services/sentiment.py` ships a tiny lexicon-based fallback (deterministic,
zero dependencies). Swap for FinBERT:
```python
from transformers import pipeline
finbert = pipeline("text-classification", model="ProsusAI/finbert")
def score(text):
    r = finbert(text[:512])[0]
    return {"label": r["label"], "score": r["score"], "model_name": "finbert"}
```
