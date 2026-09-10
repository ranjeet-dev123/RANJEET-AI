from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse
from pathlib import Path
import shutil
import uuid
import re

from rag.pdf_loader import extract_text_from_pdf
from rag.chunker import chunk_text
from rag.retriever import add_document, list_documents, delete_document

router = APIRouter(prefix="/rag", tags=["rag"])

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


# ═══════════════════════════════════════════════════════
# Helper: filename se safe collection name banao
# ═══════════════════════════════════════════════════════
def make_collection_name(filename: str) -> str:
    """PDF filename se safe collection name banao"""
    name = filename.replace(".pdf", "").lower()
    name = re.sub(r"[^a-z0-9_]", "_", name)
    return name[:50]


# ═══════════════════════════════════════════════════════
# UPLOAD PDF
# ═══════════════════════════════════════════════════════
@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Sirf PDF files allowed hain")

    # Unique doc_id
    doc_id = str(uuid.uuid4())[:8]
    save_path = UPLOAD_DIR / f"{doc_id}_{file.filename}"

    # File save karo
    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        # Text extract
        text = extract_text_from_pdf(str(save_path))

        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail="PDF mein text nahi mila (shayad scanned image hai)"
            )

        # Chunks banao
        chunks = chunk_text(text, chunk_size=400, overlap=50)

        # 👇 Har PDF ka apna collection
        collection_name = make_collection_name(file.filename)
        add_document(collection_name, doc_id, chunks)

        return {
            "status": "success",
            "doc_id": doc_id,
            "filename": file.filename,
            "collection": collection_name,
            "chunks": len(chunks),
            "characters": len(text),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════
# LIST all uploaded PDFs
# ═══════════════════════════════════════════════════════
@router.get("/list")
def list_all_pdfs():
    """Saare uploaded PDFs ki list"""
    pdfs = []
    for file_path in UPLOAD_DIR.glob("*.pdf"):
        name = file_path.name
        # Format: {doc_id}_{original_filename}.pdf
        if "_" in name:
            parts = name.split("_", 1)
            doc_id = parts[0]
            original = parts[1] if len(parts) > 1 else name
        else:
            doc_id = "unknown"
            original = name

        pdfs.append({
            "doc_id": doc_id,
            "filename": original,
            "size": f"{file_path.stat().st_size / 1024:.0f} KB",
            "collection": make_collection_name(original),
        })

    # Latest pehle
    pdfs.sort(key=lambda x: x["filename"])
    return {"pdfs": pdfs}


# ═══════════════════════════════════════════════════════
# VIEW PDF (browser mein inline open)
# ═══════════════════════════════════════════════════════
@router.get("/view/{doc_id}")
def view_pdf(doc_id: str):
    """PDF file browser mein dikhane ke liye"""
    for file_path in UPLOAD_DIR.glob(f"{doc_id}_*.pdf"):
        return FileResponse(
            str(file_path),
            media_type="application/pdf",
            headers={"Content-Disposition": "inline"},
        )
    raise HTTPException(status_code=404, detail="PDF not found")


# ═══════════════════════════════════════════════════════
# DELETE PDF
# ═══════════════════════════════════════════════════════
@router.delete("/delete/{doc_id}")
def delete_pdf(doc_id: str):
    """PDF file aur uska collection delete karo"""
    deleted = False

    for file_path in UPLOAD_DIR.glob(f"{doc_id}_*.pdf"):
        # Original filename nikalo
        name = file_path.name
        if "_" in name:
            original = name.split("_", 1)[1]
        else:
            original = name

        collection_name = make_collection_name(original)

        # Vector DB se delete karo
        try:
            delete_document(collection_name, doc_id)
        except Exception as e:
            print(f"Vector delete warning: {e}")

        # File delete karo
        file_path.unlink()
        deleted = True

    if not deleted:
        raise HTTPException(status_code=404, detail="PDF not found")

    return {"status": "deleted", "doc_id": doc_id}


# ═══════════════════════════════════════════════════════
# OLD endpoints (backward compatibility)
# ═══════════════════════════════════════════════════════
@router.get("/documents")
def get_documents(collection: str = "default"):
    """Uploaded documents ki list (specific collection)"""
    docs = list_documents(collection)
    return {"documents": docs}


@router.delete("/documents/{doc_id}")
def remove_document(doc_id: str, collection: str = "default"):
    """Document delete karo (specific collection)"""
    delete_document(collection, doc_id)
    return {"status": "deleted"}