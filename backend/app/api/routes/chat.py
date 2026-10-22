import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.ai import AIConversation
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.ai.chat_service import answer

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        result = answer(db, user.id, payload.message, payload.context_ticker)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="The market-data provider could not answer this request. Please retry shortly.")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    db.add(AIConversation(user_id=user.id, role="user", content=payload.message,
                           context_ticker=payload.context_ticker))
    db.add(AIConversation(user_id=user.id, role="assistant", content=result["reply"],
                           context_ticker=payload.context_ticker,
                           tools_used=",".join(result["tools_used"])))
    db.commit()

    return ChatResponse(reply=result["reply"], tools_used=result["tools_used"], data=result["data"])
