from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Float
from sqlalchemy.sql import func

from app.database import Base


class News(Base):
    __tablename__ = "news"
    id = Column(Integer, primary_key=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=True, index=True)  # null = market-wide
    sector_id = Column(Integer, ForeignKey("sectors.id"), nullable=True)
    headline = Column(String(500), nullable=False)
    summary = Column(Text, nullable=True)
    source = Column(String(120), nullable=False)
    url = Column(String(500), nullable=True)
    published_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class NewsSentiment(Base):
    __tablename__ = "news_sentiment"
    id = Column(Integer, primary_key=True)
    news_id = Column(Integer, ForeignKey("news.id"), unique=True, nullable=False)
    label = Column(String(10), nullable=False)   # positive | neutral | negative
    score = Column(Float, nullable=False)        # -1..1
    model_name = Column(String(80), nullable=False, default="lexicon-fallback")
