from fastapi import APIRouter
from database import get_supabase
from models.schemas import ScamCheckRequest, ScamCheckResponse
from services.claude_service import check_scam

router = APIRouter()


@router.post("/check", response_model=ScamCheckResponse)
async def scam_check(body: ScamCheckRequest):
    result = check_scam(body.listing_text)

    if body.user_id:
        supabase = get_supabase()
        supabase.table("scam_checks").insert(
            {
                "user_id": body.user_id,
                "listing_input": body.listing_text,
                "scam_score": result.get("scam_score"),
                "red_flags": result.get("red_flags"),
                "hidden_fees": result.get("hidden_fees"),
                "verdict": result.get("verdict"),
            }
        ).execute()

    return result
