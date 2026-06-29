import logging
from typing import Any
from fastapi import APIRouter, HTTPException, Query, Request

from database import get_supabase
from models.schemas import ScamCheckHistoryItem, ScamCheckHistoryResponse, ScamCheckRequest, ScamCheckResponse
from services.logging_service import log_event
from services.openai_service import check_scam
from services.usage_service import cache_key, enforce_quota, get_cached, require_user, set_cached

router = APIRouter()
logger = logging.getLogger("rentpilot")


def _normalize_json_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def _normalize_scam_history_row(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(row.get("id") or ""),
        "listing_input": row.get("listing_input") or "",
        "created_at": row.get("created_at") or "",
        "result": {
            "scam_score": int(row.get("scam_score") or 0),
            "verdict": row.get("verdict") or "suspicious",
            "red_flags": _normalize_json_list(row.get("red_flags")),
            "hidden_fees": _normalize_json_list(row.get("hidden_fees")),
            "tips": _normalize_json_list(row.get("tips")),
        },
    }


@router.post("/check", response_model=ScamCheckResponse)
async def scam_check(body: ScamCheckRequest, request: Request):
    user_id = require_user(request)
    log_event(logger, "scam_check_requested", user_id=user_id, input_chars=len(body.listing_text))

    # Identical listings are served from cache — no OpenAI cost, no quota use.
    key = cache_key("scam", body.listing_text)
    cached = get_cached(key)
    if cached is not None:
        log_event(logger, "scam_check_cache_hit", user_id=user_id, input_chars=len(body.listing_text))
        return cached

    enforce_quota(user_id, "scam")
    result = check_scam(body.listing_text)
    set_cached(key, "scam", result)
    log_event(
        logger,
        "scam_check_completed",
        user_id=user_id,
        input_chars=len(body.listing_text),
        verdict=result.get("verdict"),
        score=result.get("scam_score"),
        red_flag_count=len(result.get("red_flags") or []),
    )

    insert_payload = {
        "user_id": user_id,
        "listing_input": body.listing_text,
        "scam_score": result.get("scam_score"),
        "red_flags": result.get("red_flags"),
        "hidden_fees": result.get("hidden_fees"),
        "verdict": result.get("verdict"),
        "tips": result.get("tips"),
    }
    try:
        get_supabase().table("scam_checks").insert(insert_payload).execute()
    except Exception:
        try:
            fallback_payload = dict(insert_payload)
            fallback_payload.pop("tips", None)
            get_supabase().table("scam_checks").insert(fallback_payload).execute()
        except Exception:
            pass

    return result


@router.get("/history", response_model=ScamCheckHistoryResponse)
async def list_scam_history(
    request: Request,
    limit: int | None = Query(default=None, ge=1, le=100),
):
    user_id = require_user(request)
    rows = (
        get_supabase()
        .table("scam_checks")
        .select("*")
        .eq("user_id", user_id)
        .execute()
        .data
        or []
    )
    rows = sorted(rows, key=lambda row: row.get("created_at") or "", reverse=True)
    if limit is not None:
        rows = rows[:limit]
    return {"items": [_normalize_scam_history_row(row) for row in rows]}


@router.get("/history/{check_id}", response_model=ScamCheckHistoryItem)
async def get_scam_history_detail(request: Request, check_id: str):
    user_id = require_user(request)
    row = (
        get_supabase()
        .table("scam_checks")
        .select("*")
        .eq("id", check_id)
        .eq("user_id", user_id)
        .single()
        .execute()
        .data
    )
    if not row:
        raise HTTPException(status_code=404, detail="Scam check not found.")
    return _normalize_scam_history_row(row)
