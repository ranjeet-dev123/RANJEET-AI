def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50):
    """
    Text ko chhote chunks mein todo.
    Overlap se context behtar milta hai.
    """
    chunks = []
    words = text.split()
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
    
    return chunks