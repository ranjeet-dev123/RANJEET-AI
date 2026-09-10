from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import chat, conversations, rag

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

app.include_router(chat.router)
app.include_router(conversations.router)
app.include_router(rag.router)


@app.get("/")
def health_check():
    return {"status": "RajAI backend running"}