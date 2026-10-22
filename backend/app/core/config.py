from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+psycopg2://marketai:marketai@localhost:5432/marketai"
    REDIS_URL: str = "redis://localhost:6379/0"

    JWT_SECRET: str = "dev-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Market data providers. Keep MARKET_DATA_PROVIDER for backward compatibility.
    MARKET_DATA_PROVIDER: str = "mock"
    MARKET_DATA_API_KEY: str = ""
    INDIA_MARKET_DATA_PROVIDER: str = "tapetide"
    TAPETIDE_API_KEY: str = ""
    US_MARKET_DATA_PROVIDER: str = "alpaca"
    ALPACA_API_KEY: str = ""
    ALPACA_API_SECRET_KEY: str = ""

    NEWS_PROVIDER: str = "mock"
    NEWS_API_KEY: str = ""

    FX_PROVIDER: str = "mock"
    FX_API_KEY: str = ""

    LLM_PROVIDER: str = "none"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "claude-sonnet-4-6"

    DEFAULT_INR_DEMO_CASH: float = 1_000_000
    DEFAULT_USD_DEMO_CASH: float = 100_000

    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = "http://localhost:5173"


settings = Settings()
