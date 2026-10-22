import httpx
from fastapi import APIRouter, HTTPException, Query

from app.services.providers.registry import (
    get_market_data_provider, get_financial_data_provider,
    get_news_provider, get_analyst_data_provider,
)
from app.services import technical

router = APIRouter(prefix="/api/stocks", tags=["stocks"])


def _hist_arrays(ticker: str, range_key: str = "6M"):
    hist = get_market_data_provider(ticker=ticker).get_history(ticker, range_key)
    return hist, [h["close"] for h in hist], [h["high"] for h in hist], [h["low"] for h in hist]


@router.get("/{ticker}")
def stock_quote(ticker: str):
    try:
        return get_market_data_provider(ticker=ticker).get_quote(ticker)
    except ValueError:
        raise HTTPException(status_code=404, detail="Unknown ticker")
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Market data provider request failed. Check provider credentials and try again.")


@router.get("/{ticker}/history")
def stock_history(ticker: str, range: str = Query(default="6M")):
    try:
        return get_market_data_provider(ticker=ticker).get_history(ticker, range)
    except ValueError:
        raise HTTPException(status_code=404, detail="Unknown ticker")
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.get("/{ticker}/financials")
def stock_financials(ticker: str, period: str = Query(default="annual")):
    try:
        return get_financial_data_provider().get_financials(ticker, period)
    except ValueError:
        raise HTTPException(status_code=404, detail="Unknown ticker")


@router.get("/{ticker}/news")
def stock_news(ticker: str):
    return get_news_provider().get_company_news(ticker)


@router.get("/{ticker}/technical")
def stock_technical(ticker: str, range: str = Query(default="6M")):
    try:
        _, closes, highs, lows = _hist_arrays(ticker, range)
    except ValueError:
        raise HTTPException(status_code=404, detail="Unknown ticker")
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    if not closes:
        raise HTTPException(status_code=404, detail="Unknown ticker")
    return {
        "sma20": technical.sma(closes, 20), "sma50": technical.sma(closes, 50),
        "ema12": technical.ema(closes, 12), "ema26": technical.ema(closes, 26),
        "rsi": technical.rsi(closes), "macd": technical.macd(closes),
        "bollinger": technical.bollinger(closes), "atr": technical.atr(highs, lows, closes),
    }


@router.get("/{ticker}/analyst")
def stock_analyst(ticker: str):
    rating = get_analyst_data_provider().get_ratings(ticker)
    if not rating:
        raise HTTPException(status_code=404, detail="No analyst data")
    return rating
