# MarketAI — AI-Powered Stock & Global Market Analyzer

An educational **paper-trading** platform: market data, company research,
technicals/fundamentals, live news + sentiment, an AI chatbot with tool
calling, and a full virtual-money trading + portfolio system.

**No real-money trades are ever placed.** Every provider ships a clearly
labeled mock implementation so the whole app runs with zero API keys.

---

## 1. Status — what's real right now

This repo was generated as a working scaffold, syntax-checked file by
file, but **not run end-to-end** (the environment that generated it had no
network access to install dependencies). Before you treat anything here as
"done," run it yourself following Section 3 and work through Section 7
(Known gaps / next steps).

What's implemented:
- FastAPI backend: auth (register/login + a `Bearer demo` development shortcut),
  REST endpoints, SQLAlchemy models, and a provider abstraction layer.
- Regional market routing: Tapetide for supported Indian equities and Alpaca
  for US equities when valid credentials are configured; missing credentials
  fall back to the clearly labelled deterministic mock quote/history provider.
- Mock news, financial statements, analyst ratings, FX, and index data remain
  demo implementations unless a separate provider is integrated.
- Paper trading engine (`app/services/portfolio_service.py`) — buy by qty
  or amount, sell with holdings validation, average-price recalculation,
  P/L, portfolio summary — with a pytest suite covering the exact edge
  cases the spec calls out (insufficient cash, insufficient shares,
  invalid orders, average price on repeat buys).
- Technical indicators (SMA/EMA/RSI/MACD/Bollinger/ATR) as a single shared
  module used by the API, the AI tools, and the ML feature pipeline.
- AI tool-calling layer: intent detection → tool call → real data →
  templated response, runnable with **zero LLM API key** (`LLM_PROVIDER=none`).
  A hook is left for wiring a real Claude call in `chat_service.py`.
- ML skeleton: feature engineering + a RandomForest trend classifier with
  a strict time-ordered train/test split, plus an explainability report.
- React + TypeScript + Vite + Tailwind frontend hitting every backend
  endpoint: dashboard, markets, global markets, company page (chart,
  technicals, fundamentals, financials, analyst, news), portfolio,
  watchlist, AI chat.

What's intentionally stubbed / not built:
- Live index feeds, full symbol search, company profiles, financial statements,
  analyst ratings, news, and FX are not supplied by the Tapetide/Alpaca quote
  adapters in this version. Those areas use mock/demo data or a limited search
  catalog; do not treat them as verified live company fundamentals.
- WebSockets / live push (the frontend currently polls).
- Background workers for alerts (alert *records* are stored; nothing
  currently evaluates and fires them yet — see Section 7).
- A real LLM behind the chatbot (currently rule-based tool routing).
- CI, Alembic migrations (using `Base.metadata.create_all` for now),
  rate limiting, full auth hardening.

---

## 2. Architecture

```
market-ai/
  backend/        FastAPI + SQLAlchemy + Postgres
    app/
      api/routes/     one file per resource (auth, market, stocks, ...)
      models/         SQLAlchemy tables, one file per domain
      schemas/        Pydantic request/response models
      services/
        providers/    base.py (interfaces) + mock_provider.py + registry.py
        ai/            tools.py (tool functions) + chat_service.py (routing)
        portfolio_service.py, technical.py, sentiment.py
      tests/          pytest — portfolio/orders + technical indicators
    database/seed.py  seeds the mock universe + a demo user
  frontend/       React + TS + Vite + Tailwind + TanStack Query
  ml/             feature engineering, training, explainability
  docs/           ARCHITECTURE.md, API.md, DATABASE.md, AI.md, ML.md
  docker-compose.yml
```

See `docs/ARCHITECTURE.md` for the full request-flow diagrams.

---

## 3. Running it

### Option A — Docker Compose (recommended)
```bash
cp .env.example .env
docker compose up --build
# backend:  http://localhost:8000/api/health
# frontend: http://localhost:5173
```
Then seed the database once:
```bash
docker compose exec backend python -m database.seed
```

### Option B — manually
```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env   # edit DATABASE_URL if not using Docker's Postgres
python -m database.seed
uvicorn app.main:app --reload

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```
Open http://localhost:5173. The frontend calls the backend as `Bearer demo`,
which maps to the seeded `demo@marketai.local` user — no login screen needed
to explore the app immediately. Wire up `/api/auth/register` + `/login` in
the UI when you're ready for real accounts.

### Tests
```bash
cd backend
pytest -v
```

---

## 4. Environment variables
See `.env.example`. Everything defaults to the mock provider / no-LLM mode,
so the app is fully runnable with an empty `.env`.

---

## 5. Adding a real data provider
1. Review `app/services/providers/base.py` and the existing Tapetide/Alpaca adapters.
2. Configure `INDIA_MARKET_DATA_PROVIDER` / `TAPETIDE_API_KEY` and
   `US_MARKET_DATA_PROVIDER` / `ALPACA_API_KEY` / `ALPACA_API_SECRET_KEY`
   in `.env`. Keep `.env` private and never commit credentials.
3. Add separate provider adapters for indices, company fundamentals, analyst ratings,
   news, and FX if you need verified live data for those sections.

Suggested real providers to evaluate (verify current pricing/limits/ToS
yourself before committing — this list is a starting point, not a
recommendation of record):
- **Market data**: Twelve Data, Finnhub, Alpha Vantage (free tiers exist;
  Indian-exchange coverage varies — check NSE/BSE support specifically).
- **News**: NewsAPI.org, Finnhub News.
- **FX**: exchangerate.host, Twelve Data FX endpoints.
- **Sentiment**: swap `app/services/sentiment.py`'s lexicon fallback for a
  real FinBERT pipeline via `transformers` (see `docs/AI.md`).
- **LLM**: Anthropic API (`LLM_PROVIDER=anthropic`) — wire the `anthropic`
  SDK into `chat_service.py`'s `_call_llm` hook.

---

## 6. Disclaimer
Educational, paper-trading only. Nothing in this app is financial advice.
AI/ML outputs describe retrieved data and historical patterns; they are
never guarantees of future performance.

---

## 7. Known gaps / suggested next steps
1. Run the automated GitHub Actions checks for backend tests and the frontend build.
   Also test live provider calls locally with valid keys; CI intentionally uses mock data.
2. Add Alembic migrations before the schema stabilizes further.
3. Implement the alert-evaluation background job (APScheduler or a Redis
   queue) that reads `alerts` and calls the market-data provider on a
   schedule.
4. Add a WebSocket endpoint for live index/news push instead of polling.
5. Build out the Learn/education content and sector-detail pages.
6. Harden auth (refresh tokens, rate limiting, CORS lockdown for prod).
