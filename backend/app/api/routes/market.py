from fastapi import APIRouter, Query

from app.services.providers.registry import get_market_data_provider
from app.services.providers.mock_provider import MockMarketDataProvider

router = APIRouter(prefix="/api", tags=["market"])


def _normalized_region(region: str | None) -> str | None:
    value = (region or "").strip().lower()
    if value in {"in", "india", "nse", "bse"}:
        return "india"
    if value in {"us", "usa", "nasdaq", "nyse"}:
        return "us"
    return None


@router.get("/market/indices")
def market_indices(region: str | None = Query(default=None)):
    normalized = _normalized_region(region)
    provider = get_market_data_provider(region=region)
    items = provider.get_indices(normalized)
    # The configured stock quote providers do not currently expose index data.
    # Fall back explicitly to labelled mock index data instead of returning an empty page.
    if not items:
        items = MockMarketDataProvider().get_indices(normalized)
    return items


@router.get("/global/markets")
def global_markets():
    return market_indices(region="US")


@router.get("/search")
def search(q: str = Query(min_length=1), region: str | None = Query(default=None)):
    normalized = _normalized_region(region)
    provider = get_market_data_provider(region=region)
    results = provider.search(q)
    if not results:
        results = MockMarketDataProvider().search(q)
    if normalized == "india":
        results = [item for item in results if str(item.get("exchange", "")).upper() in {"NSE", "BSE", "NSE/BSE"}]
    elif normalized == "us":
        results = [item for item in results if str(item.get("exchange", "")).upper() not in {"NSE", "BSE", "NSE/BSE"}]
    return results
