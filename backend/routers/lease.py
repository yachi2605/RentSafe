import logging
from typing import Any
from fastapi import APIRouter, File, Form, HTTPException, Query, Request, UploadFile
from uuid import uuid4

from database import get_supabase
from models.schemas import (
    LeaseAnalysisResponse, LeaseAskResponse,
    ProactiveQARequest, ProactiveQAResponse,
    LeaseAskTextRequest, LeaseAnalysisHistoryItem, LeaseAnalysisHistoryResponse, NegotiateClauseRequest,
    NegotiateClauseResponse,
)
from services.openai_service import (
    analyze_lease, answer_lease_question,
    generate_proactive_qa, generate_negotiation_email, generate_moveout_checklist,
)
from services.logging_service import log_event
from services.pdf_service import extract_text_from_pdf
from services.usage_service import cache_key, enforce_quota, get_cached, optional_user, require_user, set_cached

router = APIRouter()
logger = logging.getLogger("rentpilot")


def _normalize_json_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def _normalize_lease_history_row(row: dict[str, Any], include_text: bool = False) -> dict[str, Any]:
    result = {
        "summary": row.get("summary") or "No summary was saved for this lease yet.",
        "red_flags": _normalize_json_list(row.get("red_flags")),
        "negotiation_tips": _normalize_json_list(row.get("negotiation_tips")),
        "tenant_friendly_score": int(row.get("tenant_friendly_score") or 0),
        "extracted_text": row.get("extracted_text") or "",
    }
    if not include_text:
        result["extracted_text"] = ""

    return {
        "id": str(row.get("id") or ""),
        "file_name": row.get("file_name") or "Lease document",
        "file_url": row.get("file_url") or "",
        "created_at": row.get("created_at") or "",
        "result": result,
    }


@router.post("/analyze", response_model=LeaseAnalysisResponse)
async def analyze_lease_endpoint(
    request: Request,
    file: UploadFile = File(...),
    user_id: str | None = Form(default=None),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty PDF file")

    # Anonymous users get full functionality; authenticated users also get DB history.
    auth_user_id = optional_user(request)
    user_id = user_id or auth_user_id
    log_event(logger, "lease_analysis_requested", user_id=auth_user_id or "anonymous", file_name=file.filename)

    extracted = extract_text_from_pdf(contents)

    # Guard against image-only PDFs that yield no text.
    if not extracted["full_text"].strip():
        raise HTTPException(
            status_code=422,
            detail=(
                "No text could be extracted from this PDF. "
                "It may be a scanned image — please use a text-based PDF or copy-paste the lease text."
            ),
        )

    # For multi-chunk leases, analyze the first (most clause-dense) chunk only.
    # full_text can be unbounded for very large docs; chunks are capped at 80k chars each.
    analyze_text = extracted["chunks"][0]

    # Re-analyzing the same lease text is free (cache hit, no quota use).
    key = cache_key("lease", analyze_text)
    cached = get_cached(key)
    if cached is not None:
        log_event(
            logger,
            "lease_analysis_cache_hit",
            user_id=auth_user_id or "anonymous",
            file_name=file.filename,
            extracted_chars=len(extracted["full_text"]),
        )
        return cached

    # Only enforce quota for authenticated users — anonymous traffic is bounded by cache + upstream limits.
    if auth_user_id:
        enforce_quota(auth_user_id, "lease")
    result = analyze_lease(analyze_text)
    result["extracted_text"] = extracted["full_text"]  # persist so frontend never re-uploads
    set_cached(key, "lease", result)
    log_event(
        logger,
        "lease_analysis_completed",
        user_id=auth_user_id or "anonymous",
        file_name=file.filename,
        extracted_chars=len(extracted["full_text"]),
        red_flag_count=len(result.get("red_flags") or []),
        score=result.get("tenant_friendly_score"),
        authenticated=auth_user_id is not None,
    )

    if user_id:
        safe_name = file.filename.replace(" ", "_")
        path = f"{user_id}/{uuid4()}_{safe_name}"
        file_url = f"{path}"
        insert_payload = {
            "user_id": user_id,
            "file_name": file.filename,
            "file_url": file_url,
            "summary": result.get("summary"),
            "red_flags": result.get("red_flags"),
            "negotiation_tips": result.get("negotiation_tips"),
            "tenant_friendly_score": result.get("tenant_friendly_score"),
            "extracted_text": result.get("extracted_text"),
        }
        try:
            get_supabase().table("lease_analyses").insert(insert_payload).execute()
        except Exception:
            try:
                fallback_payload = dict(insert_payload)
                fallback_payload.pop("extracted_text", None)
                get_supabase().table("lease_analyses").insert(fallback_payload).execute()
            except Exception:
                pass

    return result


@router.get("/history", response_model=LeaseAnalysisHistoryResponse)
async def list_lease_history(
    request: Request,
    limit: int | None = Query(default=None, ge=1, le=100),
):
    user_id = require_user(request)
    rows = (
        get_supabase()
        .table("lease_analyses")
        .select("*")
        .eq("user_id", user_id)
        .execute()
        .data
        or []
    )
    rows = sorted(rows, key=lambda row: row.get("created_at") or "", reverse=True)
    if limit is not None:
        rows = rows[:limit]
    return {"items": [_normalize_lease_history_row(row) for row in rows]}


@router.get("/history/{analysis_id}", response_model=LeaseAnalysisHistoryItem)
async def get_lease_history_detail(request: Request, analysis_id: str):
    user_id = require_user(request)
    row = (
        get_supabase()
        .table("lease_analyses")
        .select("*")
        .eq("id", analysis_id)
        .eq("user_id", user_id)
        .single()
        .execute()
        .data
    )
    if not row:
        raise HTTPException(status_code=404, detail="Lease analysis not found.")
    return _normalize_lease_history_row(row, include_text=True)


@router.post("/proactive-qa", response_model=ProactiveQAResponse)
async def proactive_qa_endpoint(request: Request, body: ProactiveQARequest):
    """Auto-generate 5 key Q&As from the lease — no user input required."""
    auth_user_id = optional_user(request)
    if not body.lease_text.strip():
        raise HTTPException(status_code=422, detail="Lease text is empty.")

    key = cache_key("lease_proactive", body.lease_text)
    cached = get_cached(key)
    if cached is not None:
        log_event(logger, "lease_proactive_qa_cache_hit", user_id=auth_user_id or "anonymous")
        return cached

    items = generate_proactive_qa(body.lease_text)
    response = {"items": items}
    set_cached(key, "lease_proactive", response)
    log_event(logger, "lease_proactive_qa_completed", user_id=auth_user_id or "anonymous", item_count=len(items))
    return response


@router.post("/ask-text", response_model=LeaseAskResponse)
async def ask_lease_text_endpoint(request: Request, body: LeaseAskTextRequest):
    """Answer a question using already-extracted lease text (no re-upload)."""
    auth_user_id = optional_user(request)
    if not body.lease_text.strip():
        raise HTTPException(status_code=422, detail="Lease text is empty.")
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    key = cache_key("lease_qa", body.lease_text, body.question)
    cached = get_cached(key)
    if cached is not None:
        log_event(logger, "lease_question_cache_hit", user_id=auth_user_id or "anonymous")
        return cached

    if auth_user_id:
        enforce_quota(auth_user_id, "lease_qa")
    answer = answer_lease_question(body.lease_text, body.question)
    response = {
        "answer": answer,
        "disclaimer": "AI-generated from your lease document — not legal advice.",
    }
    set_cached(key, "lease_qa", response)
    log_event(logger, "lease_question_answered", user_id=auth_user_id or "anonymous", answered=bool(answer))
    return response


@router.post("/negotiate-clause", response_model=NegotiateClauseResponse)
async def negotiate_clause_endpoint(request: Request, body: NegotiateClauseRequest):
    """Draft a professional negotiation email for a specific red-flag clause."""
    auth_user_id = optional_user(request)

    key = cache_key("lease_negotiate", body.clause, body.clause_text)
    cached = get_cached(key)
    if cached is not None:
        log_event(logger, "lease_negotiation_cache_hit", user_id=auth_user_id or "anonymous", clause=body.clause)
        return cached

    if auth_user_id:
        enforce_quota(auth_user_id, "lease_qa")
    result = generate_negotiation_email(body.clause, body.clause_text, body.explanation)
    set_cached(key, "lease_negotiate", result)
    log_event(logger, "lease_negotiation_generated", user_id=auth_user_id or "anonymous", clause=body.clause)
    return result


@router.post("/moveout-checklist")
async def moveout_checklist_endpoint(request: Request, body: ProactiveQARequest):
    """Generate a lease-specific move-out protection checklist."""
    auth_user_id = optional_user(request)
    if not body.lease_text.strip():
        raise HTTPException(status_code=422, detail="Lease text is empty.")

    key = cache_key("lease_moveout", body.lease_text)
    cached = get_cached(key)
    if cached is not None:
        log_event(logger, "lease_moveout_checklist_cache_hit", user_id=auth_user_id or "anonymous")
        return cached

    if auth_user_id:
        enforce_quota(auth_user_id, "lease_qa")
    items = generate_moveout_checklist(body.lease_text)
    response = {"items": items}
    set_cached(key, "lease_moveout", response)
    log_event(logger, "lease_moveout_checklist_generated", user_id=auth_user_id or "anonymous", item_count=len(items))
    return response


@router.post("/ask", response_model=LeaseAskResponse)
async def ask_lease_question_endpoint(
    request: Request,
    file: UploadFile = File(...),
    question: str = Form(...),
):
    """Answer a question about a specific lease document."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty PDF file")
    if not question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    auth_user_id = optional_user(request)
    extracted = extract_text_from_pdf(contents)

    if not extracted["full_text"].strip():
        raise HTTPException(
            status_code=422,
            detail="No text could be extracted from this PDF. It may be a scanned image.",
        )

    lease_text = extracted["full_text"]
    key = cache_key("lease_qa", lease_text, question)
    cached = get_cached(key)
    if cached is not None:
        return cached

    if auth_user_id:
        enforce_quota(auth_user_id, "lease_qa")
    answer = answer_lease_question(lease_text, question)
    response = {
        "answer": answer,
        "disclaimer": "This is AI-generated information based on your lease document, not legal advice.",
    }
    set_cached(key, "lease_qa", response)
    return response
