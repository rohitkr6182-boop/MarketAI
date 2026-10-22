from fastapi import APIRouter

from app.services.providers.mock_provider import UNIVERSE

router = APIRouter(prefix="/api/sectors", tags=["sectors"])


@router.get("")
def list_sectors():
    sectors: dict[str, list[str]] = {}
    for ticker, info in UNIVERSE.items():
        sectors.setdefault(info["sector"], []).append(ticker)
    return [{"sector": s, "companies": c} for s, c in sectors.items()]
