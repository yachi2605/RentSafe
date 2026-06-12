from fastapi import APIRouter, Request

from database import get_supabase
from models.schemas import ScamCheckRequest, ScamCheckResponse
from services.openai_service import check_scam
from services.usage_service import cache_key, enforce_quota, get_cached, require_user, set_cached

router = APIRouter()


@router.post("/check", response_model=ScamCheckResponse)
async def scam_check(body: ScamCheckRequest, request: Request):
    user_id = require_user(request)

    # Identical listings are served from cache — no OpenAI cost, no quota use.
    key = cache_key("scam", body.listing_text)
    cached = get_cached(key)
    if cached is not None:
        return cached

    enforce_quota(user_id, "scam")
    result = check_scam(body.listing_text)
    set_cached(key, "scam", result)

    try:
        supabase = get_supabase()
        supabase.table("scam_checks").insert(
            {
                "user_id": user_id,
                "listing_input": body.listing_text,
                "scam_score": result.get("scam_score"),
                "red_flags": result.get("red_flags"),
                "hidden_fees": result.get("hidden_fees"),
                "verdict": result.get("verdict"),
            }
        ).execute()
    except Exception:
        pass

    return result
