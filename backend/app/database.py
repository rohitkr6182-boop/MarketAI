from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables. For a real project, replace with Alembic migrations
    (see database/migrations) once the schema stabilizes."""
    from app import models  # noqa: F401  (ensures models are registered on Base)
    Base.metadata.create_all(bind=engine)
