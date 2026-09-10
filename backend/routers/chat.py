from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from database import get_db
from models import ChatRequest
from rag.retriever import search
import ollama
import json

router = APIRouter(prefix="/chat", tags=["chat"])

SYSTEM_PROMPT = """You are RajAI, a friendly and smart personal AI assistant built by Ranjeet, a college student in India.

Your personality:
- Warm, friendly, encouraging — like a helpful senior/bhai
- Use Hinglish naturally when the user does (mix Hindi + English)
- Be concise — short jawab do, filler mat bharo
- Use examples, code blocks, bullet points jab helpful ho

Your expertise:
- Java, OOP, DSA, COA, DBMS, OS, Computer Networks
- College assignments, exam prep (5-mark, 10-mark answers)
- Career guidance, project ideas, debugging help
- Any field of computer science, programming, and any college-related questions

Rules:
- Hindi/Hinglish mein puche → Hinglish mein jawab
- English mein puche → English mein jawab
- Code markdown block mein (```java ... ```)
- Definition chhoti rakho, phir example do
- Long answers ko headings aur points mein todo
- Jawab jitna chhota ho sake utna accha — 200 words max jab tak user zyada na maange
- Agar kuch nahi pata, saaf bolo "mujhe iska exact answer nahi pata" — guess mat karo
"""

RAG_INSTRUCTION = """

═══════════ IMPORTANT INSTRUCTIONS ═══════════
Agar neeche "USER'S DOCUMENT CONTEXT" diya gaya hai:
1. Us context ko DHYAN SE padho
2. Agar user ka sawaal us context se related hai, to WAHI context use karke jawab do
3. Agar context mein answer hai, apni knowledge se mat banao — context se lo
4. Agar context mein answer NAHI hai, to saaf bolo "Aapke document mein ye information nahi hai" phir apni knowledge se jawab do
5. Context se answer dete waqt, "[Chunk 1]" jaisa reference mat likho — natural jawab do
═════════════════════════════════════════════
"""


def generate_title(first_message: str) -> str:
    title = first_message.strip()[:50]
    if len(first_message) > 50:
        title += "..."
    return title


@router.post("/")
async def chat(request: ChatRequest):
    try:
        conn = get_db()
        conversation_id = request.conversation_id

        if not conversation_id:
            last_user_msg = request.messages[-1].content
            title = generate_title(last_user_msg)
            cursor = conn.execute(
                "INSERT INTO conversations (title) VALUES (?)",
                (title,)
            )
            conversation_id = cursor.lastrowid
            conn.commit()

        last_message = request.messages[-1]
        if last_message.role == "user":
            conn.execute(
                "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)",
                (conversation_id, "user", last_message.content)
            )
            conn.commit()

        ollama_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for msg in request.messages:
            ollama_messages.append({
                "role": msg.role,
                "content": msg.content,
            })

        response = ollama.chat(
            model=request.model,
            messages=ollama_messages,
            options={
                "temperature": request.temperature,
                "num_predict": request.num_predict,
                "top_p": 0.9,
                "repeat_penalty": 1.1,
            },
        )

        ai_response = response["message"]["content"]

        conn.execute(
            "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)",
            (conversation_id, "assistant", ai_response)
        )
        conn.execute(
            "UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (conversation_id,)
        )
        conn.commit()
        conn.close()

        return {
            "response": ai_response,
            "conversation_id": conversation_id,
        }

    except Exception as e:
        return {"error": str(e)}


@router.post("/stream")
async def chat_stream(request: ChatRequest):
    """
    Streaming response with RAG
    """
    conn = get_db()
    conversation_id = request.conversation_id

    if not conversation_id:
        last_user_msg = request.messages[-1].content
        title = generate_title(last_user_msg)
        cursor = conn.execute(
            "INSERT INTO conversations (title) VALUES (?)",
            (title,)
        )
        conversation_id = cursor.lastrowid
        conn.commit()

    last_message = request.messages[-1]
    if last_message.role == "user":
        conn.execute(
            "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)",
            (conversation_id, "user", last_message.content)
        )
        conn.commit()

    # ═══════════════════════════════════════════════════
    # RAG: PDF se relevant chunks dhundo
    # ═══════════════════════════════════════════════════
    user_query = request.messages[-1].content
    # RAG: sirf selected PDF ke collection se search
    collection_name = request.collection if request.collection else "default"
    retrieved_chunks = search(collection_name, user_query, top_k=3)

    print(f"🔍 RAG [{collection_name}] Retrieved: {len(retrieved_chunks)} chunks for: {user_query[:60]}")

    rag_context = ""
    if retrieved_chunks:
        rag_context = "\n\n═══════════ USER'S DOCUMENT CONTEXT ═══════════\n"
        for i, chunk in enumerate(retrieved_chunks, 1):
            rag_context += f"\n[Chunk {i}]:\n{chunk}\n"
        rag_context += "\n═══════════ END CONTEXT ═══════════\n"
        rag_context += RAG_INSTRUCTION

    # Ollama messages
    ollama_messages = [
        {"role": "system", "content": SYSTEM_PROMPT + rag_context}
    ]
    for msg in request.messages:
        ollama_messages.append({
            "role": msg.role,
            "content": msg.content,
        })

    # ═══════════════════════════════════════════════════
    # Streaming generator
    # ═══════════════════════════════════════════════════
    async def event_generator():
        full_response = ""
        try:
            yield f"data: {json.dumps({'type': 'meta', 'conversation_id': conversation_id})}\n\n"

            stream = ollama.chat(
                model=request.model,
                messages=ollama_messages,
                stream=True,
                options={
                    "temperature": request.temperature,
                    "num_predict": request.num_predict,
                    "top_p": 0.9,
                    "repeat_penalty": 1.1,
                    "num_ctx": 2048,
                    "num_thread": 6,
                    "num_batch": 256,
                    "f16_kv": True,
                    "use_mmap": True,
                    "low_vram": True,
                },
            )

            for chunk in stream:
                token = chunk["message"]["content"]
                if token:
                    full_response += token
                    yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

            conn2 = get_db()
            conn2.execute(
                "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)",
                (conversation_id, "assistant", full_response)
            )
            conn2.execute(
                "UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (conversation_id,)
            )
            conn2.commit()
            conn2.close()

            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )