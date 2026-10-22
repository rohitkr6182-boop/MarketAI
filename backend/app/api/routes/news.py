from fastapi import APIRouter, Query

from app.services.providers.registry import get_news_provider
from app.services import sentiment as sentiment_service

router = APIRouter(prefix="/api/news", tags=["news"])


@router.get("")
def market_news(limit: int = Query(default=30, le=100)):
    items = get_news_provider().get_market_news(limit)
    for item in items:
        if "sentiment" not in item:
            item["sentiment"] = sentiment_service.score(item["headline"])["label"]
    return items
