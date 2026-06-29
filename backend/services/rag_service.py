from __future__ import annotations

import re
from typing import Any

from database import get_supabase
from services.location_service import US_STATES
from services.openai_service import answer_tenant_rights
from services.rights_registry import (
    CURATED_RIGHTS_SOURCES,
    RIGHTS_COVERAGE_MESSAGE,
    RIGHTS_COVERAGE_TOPICS,
    RIGHTS_SUPPORTED_STATES,
)

QUESTION_WORD_RE = re.compile(r"[a-z0-9]+")


def _tokenize(value: str) -> set[str]:
    return {token for token in QUESTION_WORD_RE.findall(value.lower()) if len(token) > 2}


def _load_curated_sources(state: str) -> list[dict[str, Any]]:
    try:
        rows = (
            get_supabase()
            .table("rights_sources")
            .select("*")
            .eq("state", state)
            .execute()
            .data
            or []
        )
        if rows:
            return rows
    except Exception:
        pass

    return [row for row in CURATED_RIGHTS_SOURCES if row["state"] == state]


def _score_source(question_tokens: set[str], source: dict[str, Any]) -> int:
    keywords = {str(keyword).lower() for keyword in source.get("keywords") or []}
    topic_tokens = _tokenize(source.get("topic", ""))
    title_tokens = _tokenize(source.get("title", ""))
    summary_tokens = _tokenize(source.get("summary", ""))

    score = 0
    for token in question_tokens:
        if token in keywords:
            score += 5
        if token in topic_tokens:
            score += 4
        if token in title_tokens:
            score += 3
        if token in summary_tokens:
            score += 1
    return score


def _top_sources(question: str, state: str) -> list[dict[str, Any]]:
    question_tokens = _tokenize(question)
    ranked = []

    for source in _load_curated_sources(state):
        score = _score_source(question_tokens, source)
        if score > 0:
            ranked.append((score, source))

    ranked.sort(key=lambda item: item[0], reverse=True)
    return [source for _, source in ranked[:3]]


def select_rights_sources(question: str, state: str) -> list[dict[str, Any]]:
    if state not in RIGHTS_SUPPORTED_STATES:
        return []
    return _top_sources(question, state)


def _coverage_response(state: str, answer: str, sources: list[dict[str, Any]], refused: bool) -> dict[str, Any]:
    return {
        "answer": answer,
        "state": state,
        "supported_state": state in RIGHTS_SUPPORTED_STATES,
        "refused": refused,
        "coverage_message": RIGHTS_COVERAGE_MESSAGE,
        "disclaimer": (
            "RentPilot provides grounded legal information for launch states only. "
            "This is not legal advice, and city or county rules may add protections beyond the sources shown here."
        ),
        "sources": [
            {
                "title": source.get("title") or "",
                "url": source.get("source_url") or "",
                "organization": source.get("organization") or "",
                "topic": source.get("topic") or "",
            }
            for source in sources
        ],
    }


def get_rights_coverage() -> dict[str, Any]:
    return {
        "states": US_STATES,
        "supported_states": RIGHTS_SUPPORTED_STATES,
        "coverage_topics": RIGHTS_COVERAGE_TOPICS,
        "coverage_message": RIGHTS_COVERAGE_MESSAGE,
    }


def ask_tenant_rights(question: str, state: str, sources: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    if state not in RIGHTS_SUPPORTED_STATES:
        return _coverage_response(
            state,
            (
                f"RentPilot does not yet provide grounded tenant-rights answers for {state}. "
                "For now, use one of our supported launch states or contact a local tenant-rights organization or licensed attorney."
            ),
            [],
            refused=True,
        )

    sources = select_rights_sources(question, state) if sources is None else sources
    if not sources:
        return _coverage_response(
            state,
            (
                f"I cannot provide a reliable source-backed answer for that {state} question from the current launch coverage. "
                "Try asking about security deposits, repairs, landlord entry, or eviction basics, or contact a local tenant-rights organization."
            ),
            [],
            refused=True,
        )

    context = "\n\n".join(
        [
            (
                f"Source: {source.get('title')} ({source.get('organization')})\n"
                f"Topic: {source.get('topic')}\n"
                f"URL: {source.get('source_url')}\n"
                f"Summary: {source.get('summary')}"
            )
            for source in sources
        ]
    )

    answer = answer_tenant_rights(question, state, context).strip()
    if not answer:
        return _coverage_response(
            state,
            (
                f"I cannot provide a reliable source-backed answer for that {state} question from the current launch coverage. "
                "Please verify the issue with a local tenant-rights advocate or licensed attorney."
            ),
            sources,
            refused=True,
        )

    return _coverage_response(state, answer, sources, refused=False)
