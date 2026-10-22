"""
Provider abstractions. Nothing in the rest of the app should import a
concrete provider directly -- always go through services.providers.registry
so swapping mock -> real (or one real vendor -> another) never touches
route/service code.
"""
from abc import ABC, abstractmethod
from typing import Optional


class MarketDataProvider(ABC):
    @abstractmethod
    def get_quote(self, ticker: str) -> dict: ...

    @abstractmethod
    def get_history(self, ticker: str, range_key: str) -> list[dict]: ...

    @abstractmethod
    def get_indices(self, region: Optional[str] = None) -> list[dict]: ...

    @abstractmethod
    def search(self, query: str) -> list[dict]: ...


class NewsProvider(ABC):
    @abstractmethod
    def get_market_news(self, limit: int = 30) -> list[dict]: ...

    @abstractmethod
    def get_company_news(self, ticker: str, limit: int = 20) -> list[dict]: ...


class FinancialDataProvider(ABC):
    @abstractmethod
    def get_company_profile(self, ticker: str) -> dict: ...

    @abstractmethod
    def get_financials(self, ticker: str, period: str = "annual") -> list[dict]: ...


class AnalystDataProvider(ABC):
    @abstractmethod
    def get_ratings(self, ticker: str) -> Optional[dict]: ...


class FXProvider(ABC):
    @abstractmethod
    def get_rate(self, base: str, quote: str) -> float: ...
