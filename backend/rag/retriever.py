import chromadb
from pathlib import Path
from rag.embedder import embed_texts, embed_query

CHROMA_PATH = Path(__file__).parent.parent / "chroma_db"

_client = None

def get_client():
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=str(CHROMA_PATH))
    return _client


def get_or_create_collection(collection_name: str):
    client = get_client()
    return client.get_or_create_collection(name=collection_name)


def add_document(collection_name: str, doc_id: str, chunks: list):
    """Chunks ko database mein daalo"""
    collection = get_or_create_collection(collection_name)
    
    embeddings = embed_texts(chunks)
    ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
    metadatas = [{"doc_id": doc_id, "chunk_index": i} for i in range(len(chunks))]
    
    collection.add(
        documents=chunks,
        embeddings=embeddings,
        ids=ids,
        metadatas=metadatas,
    )


def search(collection_name: str, query: str, top_k: int = 3) -> list:
    """Query se relevant chunks dhundo"""
    collection = get_or_create_collection(collection_name)
    
    if collection.count() == 0:
        return []
    
    query_embedding = embed_query(query)
    
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, collection.count()),
    )
    
    if not results["documents"]:
        return []
    
    return results["documents"][0]


def list_documents(collection_name: str) -> list:
    """Kitne documents hain"""
    collection = get_or_create_collection(collection_name)
    
    if collection.count() == 0:
        return []
    
    results = collection.get()
    doc_ids = set()
    for meta in results["metadatas"]:
        doc_ids.add(meta["doc_id"])
    
    return list(doc_ids)


def delete_document(collection_name: str, doc_id: str):
    """Document delete karo"""
    collection = get_or_create_collection(collection_name)
    
    results = collection.get(
        where={"doc_id": doc_id}
    )
    
    if results["ids"]:
        collection.delete(ids=results["ids"])