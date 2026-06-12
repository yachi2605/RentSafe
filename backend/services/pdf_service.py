"""
PDF Service — Smart chunked extraction for large lease documents.
Handles leases up to 100+ pages without hitting token limits.
"""
import fitz  # PyMuPDF

MAX_CHARS_PER_CHUNK = 80_000
LEASE_CLAUSE_KEYWORDS = [
    "rent", "deposit", "termination", "late fee", "subletting", "sublease",
    "pets", "maintenance", "utilities", "entry", "notice", "eviction",
    "renewal", "liability", "alterations", "parking", "noise", "guests",
    "lease term", "early termination", "security deposit", "move out",
]

def extract_text_from_pdf(file_bytes: bytes) -> dict:
    """
    Extract text from lease PDF with smart chunking.
    Returns full_text, chunks list, total_pages, and strategy used.
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    full_text = ""
    total_pages = doc.page_count

    for page in doc:
        full_text += page.get_text()

    full_text = full_text.strip()

    # Small lease — send as-is
    if len(full_text) <= MAX_CHARS_PER_CHUNK:
        return {
            "full_text": full_text,
            "chunks": [full_text],
            "total_pages": total_pages,
            "strategy": "full_document"
        }

    # Large lease — extract only clause-relevant paragraphs
    paragraphs = full_text.split("\n\n")
    relevant = [
        p.strip() for p in paragraphs
        if any(kw in p.lower() for kw in LEASE_CLAUSE_KEYWORDS)
    ]
    focused_text = "\n\n".join(relevant)

    # Chunk with overlap if still too large
    if len(focused_text) <= MAX_CHARS_PER_CHUNK:
        return {
            "full_text": focused_text,
            "chunks": [focused_text],
            "total_pages": total_pages,
            "strategy": "clause_focused"
        }

    step = MAX_CHARS_PER_CHUNK - 500
    chunks = [focused_text[i:i + MAX_CHARS_PER_CHUNK] for i in range(0, len(focused_text), step)]
    return {
        "full_text": focused_text,
        "chunks": chunks,
        "total_pages": total_pages,
        "strategy": "clause_focused_chunked"
    }
