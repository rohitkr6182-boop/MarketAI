# API Reference (implemented routes)

All routes except `/api/auth/*` and `/api/health` require
`Authorization: Bearer <token>` — use `Bearer demo` in development
(maps to the seeded demo user).

## Auth
- `POST /api/auth/register` {email, password, full_name?} -> {access_token}
- `POST /api/auth/login` {email, password} -> {access_token}

## Market
- `GET /api/market/indices?region=india|us` -> IndexQuote[]
- `GET /api/global/markets` -> IndexQuote[]
- `GET /api/search?q=` -> company search results

## Stocks / Company
- `GET /api/stocks/{ticker}` -> current quote
- `GET /api/stocks/{ticker}/history?range=1D|1W|1M|6M|1Y|5Y|MAX`
- `GET /api/stocks/{ticker}/technical?range=`
- `GET /api/stocks/{ticker}/financials?period=annual|quarterly`
- `GET /api/stocks/{ticker}/news`
- `GET /api/stocks/{ticker}/analyst`
- `GET /api/company/{ticker}` -> profile (CEO, HQ, description, ...)
- `GET /api/sectors` -> sector -> companies mapping

## News
- `GET /api/news?limit=` -> market-wide news with sentiment labels

## Portfolio / Trading
- `GET /api/portfolio?currency=INR|USD`
- `GET /api/transactions?currency=`
- `POST /api/orders/buy` {ticker, quantity? , amount?, currency}
- `POST /api/orders/sell` {ticker, quantity, currency}

## Watchlist
- `GET /api/watchlist`
- `POST /api/watchlist` {ticker}
- `DELETE /api/watchlist/{ticker}`

## Alerts
- `GET /api/alerts`
- `POST /api/alerts` {ticker, alert_type, threshold?, direction?}
- `DELETE /api/alerts/{alert_id}`

## AI
- `POST /api/chat` {message, context_ticker?} -> {reply, tools_used, data}

## Errors
Standard FastAPI JSON error shape: `{"detail": "..."}`. Insufficient cash
and insufficient shares return HTTP 400 with a human-readable message.
Unknown tickers return 404.
