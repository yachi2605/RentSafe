"""
RentPilot Security Service
Fix #1: PII scrubbing before lease text hits the active LLM
Fix #2: Prompt injection guard on scam checker input
Fix #4: Toxicity check on user-generated bios and descriptions
"""
import re

# Presidio is initialized lazily: AnalyzerEngine() loads (and may try to
# download) a large spacy model, which must not happen at import time or on
# code paths that don't need it (e.g. the regex-only toxicity check).
_analyzer = None
_anonymizer = None

PII_ENTITIES = [
    "PERSON", "PHONE_NUMBER", "EMAIL_ADDRESS",
    "US_SSN", "US_BANK_NUMBER", "CREDIT_CARD",
    "US_PASSPORT",
]


def _get_engines():
    global _analyzer, _anonymizer
    if _analyzer is None:
        from presidio_analyzer import AnalyzerEngine
        from presidio_anonymizer import AnonymizerEngine

        _analyzer = AnalyzerEngine()
        _anonymizer = AnonymizerEngine()
    return _analyzer, _anonymizer


def scrub_pii(text: str) -> tuple[str, list[str]]:
    """Scrub PII from lease text before sending to the LLM. Returns (scrubbed_text, found_entity_types)."""
    try:
        analyzer, anonymizer = _get_engines()
        results = analyzer.analyze(text=text, entities=PII_ENTITIES, language="en")
        found_entities = list({r.entity_type for r in results})
        scrubbed = anonymizer.anonymize(text=text, analyzer_results=results).text
        return scrubbed, found_entities
    except Exception:  # noqa: BLE001 - local fallback keeps the app usable without NLP deps
        patterns = [
            ("EMAIL_ADDRESS", r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", "[email removed]"),
            ("PHONE_NUMBER", r"(?<!\w)(?:\+?1[\s.\-]?)?(?:\(?\d{3}\)?[\s.\-]*)\d{3}[\s.\-]*\d{4}(?!\w)", "[phone removed]"),
            ("US_SSN", r"\b\d{3}-\d{2}-\d{4}\b", "[ssn removed]"),
            ("CREDIT_CARD", r"\b(?:\d[ -]*?){13,16}\b", "[card removed]"),
        ]

        scrubbed = text
        found_entities: list[str] = []
        for entity, pattern, replacement in patterns:
            updated = re.sub(pattern, replacement, scrubbed, flags=re.IGNORECASE)
            if updated != scrubbed:
                found_entities.append(entity)
                scrubbed = updated

        return scrubbed, found_entities


def redact_contact_details(text: str) -> tuple[str, list[str]]:
    """Remove off-platform contact details from public posts and messages."""
    if not text:
        return text, []

    patterns = [
        ("email", r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", "[email removed]"),
        ("phone", r"(?<!\w)(?:\+?1[\s.\-]?)?(?:\(?\d{3}\)?[\s.\-]*)\d{3}[\s.\-]*\d{4}(?!\w)", "[phone removed]"),
        ("cashapp", r"(?<!\w)\$[A-Za-z][A-Za-z0-9_]{2,}", "[cashapp removed]"),
        ("messaging", r"\b(?:telegram|whatsapp|signal|wechat|kik)\s*[:\-]?\s*@?[A-Za-z0-9_.-]+\b", "[messaging handle removed]"),
        ("payment", r"\b(?:venmo|paypal|zelle)\s*[:\-]?\s*@?[A-Za-z0-9_.-]+\b", "[payment handle removed]"),
    ]

    redacted = text
    removed: list[str] = []
    for label, pattern, replacement in patterns:
        updated = re.sub(pattern, replacement, redacted, flags=re.IGNORECASE)
        if updated != redacted:
            removed.append(label)
            redacted = updated

    return redacted, removed


def guard_prompt_injection(user_input: str) -> str:
    """Wrap user input in XML delimiters to prevent prompt injection. OWASP LLM Top 10 #1."""
    sanitized = user_input.replace("</listing>", "").replace("<listing>", "")
    return f"<listing>{sanitized}</listing>"


def check_toxicity(text: str) -> dict:
    """Lightweight toxicity pre-check for user-generated content before saving to DB."""
    TOXIC_PATTERNS = [
        r'\b(hate|kill|attack|racist|slur)\b',
        r'\b(no (blacks|hispanics|asians|jews|muslims|christians))\b',
        r'\b(whites only|no immigrants)\b',
    ]
    text_lower = text.lower()
    for pattern in TOXIC_PATTERNS:
        if re.search(pattern, text_lower):
            return {"is_toxic": True, "reason": "Content violates community guidelines"}
    return {"is_toxic": False, "reason": None}
