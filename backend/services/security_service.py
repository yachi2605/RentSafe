"""
RentSafe Security Service
Fix #1: PII scrubbing before lease text hits Claude API
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
    "US_PASSPORT", "LOCATION", "DATE_TIME",
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
    analyzer, anonymizer = _get_engines()
    results = analyzer.analyze(text=text, entities=PII_ENTITIES, language="en")
    found_entities = list({r.entity_type for r in results})
    scrubbed = anonymizer.anonymize(text=text, analyzer_results=results).text
    return scrubbed, found_entities


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
