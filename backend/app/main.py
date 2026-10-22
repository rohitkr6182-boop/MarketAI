from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database import init_db
from app.api.routes import (
    auth, market, stocks, company, sectors, news,
    portfolio, orders, watchlist, alerts, chat,
)

app = FastAPI(title="MarketAI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (auth, market, stocks, company, sectors, news, portfolio, orders, watchlist, alerts, chat):
    app.include_router(router.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/api/health")
def health():
    return {"status": "ok", "environment": settings.ENVIRONMENT,
            "market_data_provider": settings.MARKET_DATA_PROVIDER,
            "llm_provider": settings.LLM_PROVIDER}
