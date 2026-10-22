# Architecture

## Request flow — market data
```
Frontend --GET /api/stocks/{ticker}--> FastAPI route
  --> services/providers/registry.get_market_data_provider()
  --> (mock today; a real vendor once configured)
  --> JSON back to frontend
```
Redis/caching layer: not yet inserted. For a real provider with rate
limits, add a cache-aside read in the provider implementation (check Redis
first, fall back to the vendor API, write-through on miss) rather than in
route code, so callers never need to know caching exists.

## Request flow — AI chat
```
Frontend POST /api/chat {message, context_ticker}
  --> chat_service.answer()
      --> regex/keyword intent detection
      --> calls one or more functions in services/ai/tools.py
          (which call the SAME provider registry as the REST routes --
           the chatbot can never see a different number than the UI does)
      --> templated reply text
  --> stored in ai_conversations
  --> {reply, tools_used, data} back to frontend
```
To upgrade to a real LLM: keep tool call results as-is, but instead of the
templated reply, send `{message, retrieved_data}` to the LLM with
instructions to phrase the answer using ONLY the retrieved_data. Never let
the LLM call tools with arguments it invented without validating the
ticker/args against known tickers first.

## Request flow — paper trading
```
Frontend POST /api/orders/buy {ticker, quantity|amount, currency}
  --> orders.py resolves ticker -> Stock row
  --> portfolio_service.buy()
      --> fetches current price from the SAME provider registry
      --> validates cash_balance >= total
      --> updates/creates Holding (recalculates avg_buy_price)
      --> debits PaperAccount.cash_balance
      --> writes a Transaction row
  --> all in one DB transaction (commit at the end)
```

## Provider abstraction
`services/providers/base.py` defines five interfaces (Market, News,
Financial, Analyst, FX). `mock_provider.py` implements all five
deterministically (seeded by ticker so numbers are stable across a
session, but never claim to be live). `registry.py` is the only place
that picks a concrete implementation, driven by `.env`. No other file
should import a concrete provider class directly.

## Real-time (not yet implemented)
Planned: a background poller writes fresh quotes/news into Redis, and a
WebSocket endpoint (`/ws/market`, `/ws/news`) streams changes to
subscribed clients. Until then the frontend polls via TanStack Query's
`refetchInterval`.
