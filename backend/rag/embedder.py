from sentence_transformers import SentenceTransformer

# Ye model local chalega, koi internet nahi chahiye
# ~80MB download hoga pehli baar
_model = None

def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def embed_texts(texts: list) -> list:
    """Texts ko vectors mein convert karo"""
    model = get_model()
    embeddings = model.encode(texts, show_progress_bar=False)
    return embeddings.tolist()


def embed_query(query: str):
    """Single query embed karo"""
    model = get_model()
    return model.encode([query])[0].tolist()