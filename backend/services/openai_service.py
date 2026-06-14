import os
from typing import Any

from openai import OpenAI
from pydantic import BaseModel


DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


class LeaseRedFlag(BaseModel):
    clause: str
    text: str
    risk_level: str
    explanation: str


class LeaseAnalysisResult(BaseModel):
    summary: str
    red_flags: list[LeaseRedFlag]
    negotiation_tips: list[str]
    tenant_friendly_score: int


class ScamRedFlag(BaseModel):
    flag: str
    explanation: str


class HiddenFee(BaseModel):
    fee_type: str
    estimated_amount: str


class ScamCheckResult(BaseModel):
    scam_score: int
    verdict: str
    red_flags: list[ScamRedFlag]
    hidden_fees: list[HiddenFee]
    tips: list[str]


def _get_client() -> OpenAI:
    api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    if not api_key:
        raise RuntimeError("Missing OPENAI_API_KEY")
    return OpenAI(api_key=api_key)


def _parse_structured_response(
    system_prompt: str,
    user_prompt: str,
    response_format: type[BaseModel],
) -> dict[str, Any]:
    client = _get_client()
    completion = client.chat.completions.parse(
        model=DEFAULT_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format=response_format,
    )

    parsed = completion.choices[0].message.parsed
    if parsed is None:
        raise RuntimeError("OpenAI returned no structured response")
    return parsed.model_dump()


def analyze_lease(lease_text: str) -> dict:
    return _parse_structured_response(
        system_prompt=(
            "You are a tenant-rights expert and legal assistant specializing in US rental law. "
            "Analyze lease text carefully, explain risks plainly, and keep outputs concise and factual."
        ),
        user_prompt=(
            "Analyze the following lease agreement.\n\n"
            "Return a structured result with:\n"
            "- summary: a 3-4 sentence plain-English overview of the lease\n"
            "- red_flags: key renter risks with clause name, quoted text, risk level, and explanation\n"
            "- negotiation_tips: actionable tips based on the issues found\n"
            "- tenant_friendly_score: an integer from 1-10 where 10 is very tenant-friendly\n\n"
            f"Lease text:\n{lease_text}"
        ),
        response_format=LeaseAnalysisResult,
    )


def check_scam(listing_text: str) -> dict:
    return _parse_structured_response(
        system_prompt=(
            "You are a rental scam detection expert familiar with common US rental fraud patterns. "
            "Assess credibility conservatively and explain each risk clearly."
        ),
        user_prompt=(
            "Analyze the following rental listing.\n\n"
            "Return a structured result with:\n"
            "- scam_score: integer from 0-100\n"
            '- verdict: one of "likely_scam", "suspicious", "possibly_legit", or "likely_legit"\n'
            "- red_flags: suspicious details with short labels and explanations\n"
            "- hidden_fees: detected or likely fees with fee type and estimated amount\n"
            "- tips: 3-5 safety tips specific to this listing\n\n"
            f"Listing:\n{listing_text}"
        ),
        response_format=ScamCheckResult,
    )


_MAX_QA_CHARS = 60_000  # safely within gpt-4o-mini's 128k-token context


def _extract_relevant_sections(lease_text: str, question: str, max_chars: int) -> str:
    """Return the most question-relevant paragraphs, up to max_chars.

    Strategy:
    1. Split into paragraphs.
    2. Score each paragraph by how many question words it contains.
    3. Pack top-scored paragraphs until budget is full (skip oversized ones,
       don't break — there may be smaller high-value paragraphs further down).
    4. If nothing fits, fall back to the first max_chars chars of the raw text.
    """
    if len(lease_text) <= max_chars:
        return lease_text

    question_words = set(w for w in question.lower().split() if len(w) > 2)
    paragraphs = [p.strip() for p in lease_text.split("\n\n") if p.strip()]

    scored = sorted(
        paragraphs,
        key=lambda p: sum(1 for w in question_words if w in p.lower()),
        reverse=True,
    )

    selected: list[str] = []
    used = 0
    for para in scored:
        if used + len(para) + 2 > max_chars:
            continue  # skip oversized paragraphs, keep looking for smaller ones
        selected.append(para)
        used += len(para) + 2

    if not selected:
        # Fallback: just send the beginning of the document
        return lease_text[:max_chars]

    return "\n\n".join(selected)


def answer_lease_question(lease_text: str, question: str) -> str:
    context = _extract_relevant_sections(lease_text, question, _MAX_QA_CHARS)
    client = _get_client()
    completion = client.chat.completions.create(
        model=DEFAULT_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a lease document assistant. The user has uploaded their lease agreement. "
                    "Answer questions ONLY based on the lease text provided. "
                    "If the answer is not found in the lease, say so clearly — do not guess. "
                    "Quote the relevant clause when helpful. Be concise and practical."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Lease document (relevant sections):\n\"\"\"\n{context}\n\"\"\"\n\n"
                    f"Question: {question}"
                ),
            },
        ],
    )
    return completion.choices[0].message.content or ""


def answer_tenant_rights(question: str, state: str, context: str) -> str:
    client = _get_client()
    response = client.responses.create(
        model=DEFAULT_MODEL,
        input=[
            {
                "role": "system",
                "content": (
                    "You are a US tenant rights expert. Answer in plain English, be practical, "
                    "and mention the type of law or regulation when the context supports it. "
                    "Do not claim certainty beyond the provided context."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"The user is in {state}.\n\n"
                    f"Context:\n{context}\n\n"
                    f"Question: {question}\n\n"
                    "Answer in 2-4 clear paragraphs without unnecessary legal jargon."
                ),
            },
        ],
    )
    return response.output_text
