from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from uuid import uuid4

from database import get_supabase
from models.schemas import (
    LeaseAnalysisResponse, LeaseAskResponse,
    ProactiveQARequest, ProactiveQAResponse,
    LeaseAskTextRequest, NegotiateClauseRequest, NegotiateClauseResponse,
)
from services.openai_service import (
    analyze_lease, answer_lease_question,
    generate_proactive_qa, generate_negotiation_email, generate_moveout_checklist,
)
from services.pdf_service import extract_text_from_pdf
from services.usage_service import cache_key, enforce_quota, get_cached, require_user, set_cached

router = APIRouter()


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

    auth_user_id = require_user(request)
    user_id = user_id or auth_user_id

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
        return cached

    enforce_quota(auth_user_id, "lease")
    result = analyze_lease(analyze_text)
    result["extracted_text"] = extracted["full_text"]  # persist so frontend never re-uploads
    set_cached(key, "lease", result)

    if user_id:
        try:
            supabase = get_supabase()
            safe_name = file.filename.replace(" ", "_")
            path = f"{user_id}/{uuid4()}_{safe_name}"
            file_url = f"{path}"

            supabase.table("lease_analyses").insert(
                {
                    "user_id": user_id,
                    "file_name": file.filename,
                    "file_url": file_url,
                    "summary": result.get("summary"),
                    "red_flags": result.get("red_flags"),
                    "negotiation_tips": result.get("negotiation_tips"),
                    "tenant_friendly_score": result.get("tenant_friendly_score"),
                }
            ).execute()
        except Exception:
            pass

    return result


@router.post("/proactive-qa", response_model=ProactiveQAResponse)
async def proactive_qa_endpoint(request: Request, body: ProactiveQARequest):
    """Auto-generate 5 key Q&As from the lease — no user input required."""
    auth_user_id = require_user(request)
    if not body.lease_text.strip():
        raise HTTPException(status_code=422, detail="Lease text is empty.")

    key = cache_key("lease_proactive", body.lease_text)
    cached = get_cached(key)
    if cached is not None:
        return cached

    # Proactive Q&A shares the lease quota — already paid when analyzing
    items = generate_proactive_qa(body.lease_text)
    response = {"items": items}
    set_cached(key, "lease_proactive", response)
    return response


@router.post("/ask-text", response_model=LeaseAskResponse)
async def ask_lease_text_endpoint(request: Request, body: LeaseAskTextRequest):
    """Answer a question using already-extracted lease text (no re-upload)."""
    auth_user_id = require_user(request)
    if not body.lease_text.strip():
        raise HTTPException(status_code=422, detail="Lease text is empty.")
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    key = cache_key("lease_qa", body.lease_text, body.question)
    cached = get_cached(key)
    if cached is not None:
        return cached

    enforce_quota(auth_user_id, "lease_qa")
    answer = answer_lease_question(body.lease_text, body.question)
    response = {
        "answer": answer,
        "disclaimer": "AI-generated from your lease document — not legal advice.",
    }
    set_cached(key, "lease_qa", response)
    return response


@router.post("/negotiate-clause", response_model=NegotiateClauseResponse)
async def negotiate_clause_endpoint(request: Request, body: NegotiateClauseRequest):
    """Draft a professional negotiation email for a specific red-flag clause."""
    auth_user_id = require_user(request)

    key = cache_key("lease_negotiate", body.clause, body.clause_text)
    cached = get_cached(key)
    if cached is not None:
        return cached

    enforce_quota(auth_user_id, "lease_qa")  # shared with Q&A quota
    result = generate_negotiation_email(body.clause, body.clause_text, body.explanation)
    set_cached(key, "lease_negotiate", result)
    return result


@router.post("/moveout-checklist")
async def moveout_checklist_endpoint(request: Request, body: ProactiveQARequest):
    """Generate a lease-specific move-out protection checklist."""
    auth_user_id = require_user(request)
    if not body.lease_text.strip():
        raise HTTPException(status_code=422, detail="Lease text is empty.")

    key = cache_key("lease_moveout", body.lease_text)
    cached = get_cached(key)
    if cached is not None:
        return cached

    enforce_quota(auth_user_id, "lease_qa")
    items = generate_moveout_checklist(body.lease_text)
    response = {"items": items}
    set_cached(key, "lease_moveout", response)
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

    auth_user_id = require_user(request)

    extracted = extract_text_from_pdf(contents)

    if not extracted["full_text"].strip():
        raise HTTPException(
            status_code=422,
            detail="No text could be extracted from this PDF. It may be a scanned image.",
        )

    lease_text = extracted["full_text"]

    # Cache per (lease, question) pair — same question on same lease is free.
    key = cache_key("lease_qa", lease_text, question)
    cached = get_cached(key)
    if cached is not None:
        return cached

    enforce_quota(auth_user_id, "lease_qa")
    answer = answer_lease_question(lease_text, question)
    response = {
        "answer": answer,
        "disclaimer": "This is AI-generated information based on your lease document, not legal advice.",
    }
    set_cached(key, "lease_qa", response)
    return response
