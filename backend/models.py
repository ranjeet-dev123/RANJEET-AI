from pydantic import BaseModel
from typing import List, Optional


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    conversation_id: Optional[int] = None
    messages: List[ChatMessage]
    model: str = "llama3.2"
    temperature: float = 0.7
    num_predict: int = 1024
    collection: Optional[str] = None    # 👈 PDF-specific collection


class ConversationCreate(BaseModel):
    title: str = "New Chat"


class ConversationUpdate(BaseModel):
    title: str