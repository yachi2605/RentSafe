from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from uuid import uuid4

from database import get_supabase
from models.schemas import LeaseAnalysisResponse
from services.claude_service import analyze_lease
from services.pdf_service import extract_text_from_pdf

router = APIRouter()


@router.post("/analyze", response_model=LeaseAnalysisResponse)
async def analyze_lease_endpoint(
    file: UploadFile = File(...),
    user_id: str | None = Form(default=None),
):
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty PDF file")

    lease_text = extract_text_from_pdf(file_bytes)
    if not lease_text:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")

    result = analyze_lease(lease_text)

    if user_id:
        supabase = get_supabase()
        bucket = supabase.storage.from_("leases")
        safe_name = file.filename.replace(" ", "_")
        path = f"{user_id}/{uuid4()}_{safe_name}"
        bucket.upload(path, file_bytes, file_options={"content-type": file.content_type})
        file_url = bucket.get_public_url(path)

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

    return result
