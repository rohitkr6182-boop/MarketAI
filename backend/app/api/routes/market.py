from fastapi import APIRouter, Query

from app.services.providers.registry import get_market_data_provider

router = APIRouter(prefix="/api", tags=["market"])


@router.get("/market/indices")
def market_indices(region: str | None = Query(default=None)):
    return get_market_data_provider().get_indices(region)


@router.get("/global/markets")
def global_markets():
    return get_market_data_provider().get_indices(None)


@router.get("/search")
def search(q: str = Query(min_length=1)):
    return get_market_data_provider().search(q)
