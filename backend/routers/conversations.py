from fastapi import APIRouter, HTTPException
from database import get_db
from models import ConversationCreate, ConversationUpdate

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("/")
def list_conversations():
    conn = get_db()
    rows = conn.execute("""
        SELECT c.id, c.title, c.created_at, c.updated_at,
               (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
        FROM conversations c
        ORDER BY c.updated_at DESC
    """).fetchall()
    conn.close()
    return [dict(row) for row in rows]


@router.post("/")
def create_conversation(data: ConversationCreate):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO conversations (title) VALUES (?)",
        (data.title,)
    )
    conn.commit()
    conv_id = cursor.lastrowid
    conn.close()
    return {"id": conv_id, "title": data.title}


@router.get("/{conversation_id}")
def get_conversation(conversation_id: int):
    conn = get_db()
    conv = conn.execute(
        "SELECT * FROM conversations WHERE id = ?",
        (conversation_id,)
    ).fetchone()

    if not conv:
        conn.close()
        raise HTTPException(status_code=404, detail="Conversation not found")

    msgs = conn.execute(
        "SELECT role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY id",
        (conversation_id,)
    ).fetchall()
    conn.close()

    return {
        "id": conv["id"],
        "title": conv["title"],
        "created_at": conv["created_at"],
        "messages": [dict(m) for m in msgs],
    }


@router.patch("/{conversation_id}")
def update_conversation(conversation_id: int, data: ConversationUpdate):
    conn = get_db()
    conn.execute(
        "UPDATE conversations SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (data.title, conversation_id)
    )
    conn.commit()
    conn.close()
    return {"status": "updated"}


@router.delete("/{conversation_id}")
def delete_conversation(conversation_id: int):
    conn = get_db()
    conn.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted"}