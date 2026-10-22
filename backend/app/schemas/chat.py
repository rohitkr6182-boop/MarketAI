from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    context_ticker: str | None = None


class ChatResponse(BaseModel):
    reply: str
    tools_used: list[str]
    data: dict | list | None = None
