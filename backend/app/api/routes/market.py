from fastapi import APIRouter, Query

from app.services.providers.registry import get_market_data_provider

router = APIRouter(prefix="/api", tags=["market"])


@router.get("/market/indices")
def market_indices(region: str | None = Query(default=None)):
    return get_market_data_provider(region=region).get_indices(region)


@router.get("/global/markets")
def global_markets():
    # Return the configured US provider's indices by default; region can be
    # specified on /api/market/indices for India or the US.
    return get_market_data_provider(region="US").get_indices(None)


@router.get("/search")
def search(q: str = Query(min_length=1), region: str | None = Query(default=None)):
    return get_market_data_provider(region=region).search(q)
