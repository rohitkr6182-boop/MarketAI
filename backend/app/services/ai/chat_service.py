"""
Chat orchestration. Two modes:

  LLM_PROVIDER=none (default) -> pure rule-based intent detection + tool
  calls + templated response. Fully functional offline, zero API cost.

  LLM_PROVIDER=anthropic -> the retrieved tool data is fed into a real
  Claude call with tool use so the model can phrase a richer answer, but
  it still only ever gets numbers this layer already fetched -- it cannot
  invent a price, a headline, or a financial figure. See the `_call_llm`
  stub below for where to wire in the `anthropic` SDK.
"""
import re
from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.ai import tools
from app.services.providers.mock_provider import UNIVERSE

TICKER_PATTERN = re.compile(r"\b(" + "|".join(UNIVERSE.keys()) + r")\b", re.IGNORECASE)


def _find_ticker(text: str, context_ticker: str | None) -> str | None:
    m = TICKER_PATTERN.search(text.upper())
    if m:
        return m.group(1).upper()
    if context_ticker and re.search(r"\bit\b|\bthis (stock|company)\b", text.lower()):
        return context_ticker.upper()
    return None


def answer(db: Session, user_id: int, message: str, context_ticker: str | None = None) -> dict:
    text = message.lower()
    ticker = _find_ticker(message, context_ticker)
    used_tools: list[str] = []

    def use(name, fn, *args, **kwargs):
        used_tools.append(name)
        return fn(*args, **kwargs)

    if "portfolio" in text or "how much money" in text or "demo cash" in text:
        currency = "USD" if "usd" in text or "$" in text else "INR"
        default_cash = settings.DEFAULT_USD_DEMO_CASH if currency == "USD" else settings.DEFAULT_INR_DEMO_CASH
        data = use("get_portfolio", tools.get_portfolio, db, user_id, currency, default_cash)
        if not data["holdings"]:
            reply = (f"Your {currency} paper account has {data['cash_balance']:,.2f} in cash and no open "
                      f"positions yet.")
        else:
            reply = (f"Portfolio value: {data['total_value']:,.2f} {currency} "
                      f"(cash {data['cash_balance']:,.2f} + holdings {data['market_value']:,.2f}). "
                      f"Total P/L: {data['total_pl']:+,.2f} ({data['return_pct']:+.2f}%).")
        return {"reply": reply, "tools_used": used_tools, "data": data}

    if not ticker and any(k in text for k in ["market", "nifty", "sensex", "nasdaq"]):
        region = "india" if any(k in text for k in ["indian", "nifty", "sensex", "india"]) else None
        data = use("get_market_indices", tools.get_market_indices, region)
        parts = [f"{d['name']} {d['value']:,.2f} ({d['change_pct']:+.2f}%)" for d in data]
        return {"reply": "Current levels -- " + "; ".join(parts) + ". (Simulated data.)",
                "tools_used": used_tools, "data": data}

    if not ticker:
        return {
            "reply": ("I can pull live quotes, technicals, financials, news and your portfolio, but I need a "
                       "ticker (e.g. TCS, INFY, AAPL) or an open company page to know what you mean."),
            "tools_used": [], "data": None,
        }

    if "news" in text:
        data = use("get_company_news", tools.get_company_news, ticker)
        if not data:
            reply = f"No recent news found for {ticker}."
        else:
            top = data[0]
            reply = f"Latest on {ticker}: \"{top['headline']}\" ({top['source']}, sentiment: {top['sentiment']})."
        return {"reply": reply, "tools_used": used_tools, "data": data}

    if any(k in text for k in ["revenue", "financial", "profit", "eps", "earnings"]):
        data = use("get_financials", tools.get_financials, ticker)
        latest = data[-1]
        reply = (f"{ticker} latest reported period ({latest['fiscal_period']}): revenue "
                  f"{latest['revenue']:,.0f}, net income {latest['net_income']:,.0f}, EPS {latest['eps']}.")
        return {"reply": reply, "tools_used": used_tools, "data": data}

    if any(k in text for k in ["rsi", "macd", "technical", "momentum", "indicator"]):
        data = use("calculate_technical_indicators", tools.calculate_technical_indicators, ticker)
        reply = tools.__dict__.get("_noop", None)
        from app.services.technical import explain_rsi
        reply = f"{ticker} -- {explain_rsi(data['rsi'])} SMA20 {data['sma20']}, MACD {data['macd']}."
        return {"reply": reply, "tools_used": used_tools, "data": data}

    if any(k in text for k in ["why", "falling", "rising", "moving", "analyze", "analysis"]):
        quote = use("get_stock_quote", tools.get_stock_quote, ticker)
        techs = use("calculate_technical_indicators", tools.calculate_technical_indicators, ticker)
        news = use("get_company_news", tools.get_company_news, ticker)
        direction = "up" if quote["change_pct"] >= 0 else "down"
        headline = news[0]["headline"] if news else "no notable company-specific news"
        from app.services.technical import explain_rsi
        reply = (
            f"{ticker} is {direction} {abs(quote['change_pct'])}% today at {quote['price']}. "
            f"{explain_rsi(techs['rsi'])} Recent coverage: \"{headline}\". "
            f"This is retrieved market data plus a rules-based read of it -- not a prediction."
        )
        return {"reply": reply, "tools_used": used_tools, "data": {"quote": quote, "technicals": techs, "news": news}}

    # default: quote
    data = use("get_stock_quote", tools.get_stock_quote, ticker)
    reply = f"{ticker} ({data['name']}) is trading at {data['price']} {data['currency']}, {data['change_pct']:+.2f}% today."
    return {"reply": reply, "tools_used": used_tools, "data": data}
