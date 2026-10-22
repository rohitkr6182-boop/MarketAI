from fastapi import APIRouter, HTTPException

from app.services.providers.registry import get_financial_data_provider

router = APIRouter(prefix="/api/company", tags=["company"])


@router.get("/{ticker}")
def company_profile(ticker: str):
    try:
        return get_financial_data_provider().get_company_profile(ticker)
    except ValueError:
        raise HTTPException(status_code=404, detail="Unknown ticker")
