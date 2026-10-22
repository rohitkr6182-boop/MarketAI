from pydantic import BaseModel


class OrderRequest(BaseModel):
    ticker: str
    quantity: float | None = None
    amount: float | None = None
    currency: str = "INR"


class SellRequest(BaseModel):
    ticker: str
    quantity: float
    currency: str = "INR"


class WatchlistAdd(BaseModel):
    ticker: str


class AlertCreate(BaseModel):
    ticker: str
    alert_type: str   # price | percent | news
    threshold: float | None = None
    direction: str | None = None   # above | below
