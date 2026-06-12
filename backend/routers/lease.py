from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from uuid import uuid4

from database import get_supabase
from models.schemas import LeaseAnalysisResponse
from services.openai_service import analyze_lease
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

    # Re-analyzing the same lease text is free (cache hit, no quota use).
    key = cache_key("lease", extracted["full_text"])
    cached = get_cached(key)
    if cached is not None:
        return cached

    enforce_quota(auth_user_id, "lease")
    result = analyze_lease(extracted["full_text"])
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
