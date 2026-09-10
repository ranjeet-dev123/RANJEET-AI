import PyPDF2
from pathlib import Path


def extract_text_from_pdf(pdf_path: str) -> str:
    """PDF se poora text nikalo"""
    text = ""
    try:
        with open(pdf_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page_num, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text:
                    text += f"\n\n--- Page {page_num + 1} ---\n\n"
                    text += page_text
    except Exception as e:
        raise Exception(f"PDF read error: {e}")
    return text