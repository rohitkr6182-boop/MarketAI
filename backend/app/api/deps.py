from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import decode_access_token
from app.models.user import User


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    """Minimal bearer-token auth. For local/dev use without registering,
    pass `Authorization: Bearer demo` to fall back to a seeded demo user
    (see database/seed.py)."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()

    if token == "demo":
        user = db.query(User).filter_by(email="demo@marketai.local").first()
        if not user:
            raise HTTPException(status_code=401, detail="Demo user not seeded -- run database/seed.py")
        return user

    email = decode_access_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter_by(email=email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
