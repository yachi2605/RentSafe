"""Auth verification, per-user daily quotas, and LLM response caching.

Keeps OpenAI spend bounded: LLM endpoints require a logged-in user, each
user gets a small daily allowance per feature, and repeated inputs are
served from a Supabase-backed cache for free.
"""
import hashlib
import os
from typing import Any

import requests
from fastapi import HTTPException, Request

from database import SUPABASE_URL, SUPABASE_SERVICE_KEY, get_supabase

# Daily per-user limits (overridable via env without code changes).
DAILY_LIMITS = {
    "lease": int(os.getenv("QUOTA_LEASE_PER_DAY", "3")),
    "lease_qa": int(os.getenv("QUOTA_LEASE_QA_PER_DAY", "10")),
    "scam": int(os.getenv("QUOTA_SCAM_PER_DAY", "5")),
    "rights": int(os.getenv("QUOTA_RIGHTS_PER_DAY", "10")),
}


def require_user(request: Request) -> str:
    """Validate the forwarded Supabase JWT and return the user id (401 otherwise)."""
    auth_header = request.headers.get("authorization", "")
    if not auth_header.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Log in to use this feature.")
    token = auth_header.split(" ", 1)[1]

    resp = requests.get(
        f"{SUPABASE_URL}/auth/v1/user",
        headers={"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {token}"},
        timeout=15,
    )
    if not resp.ok:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    user_id = resp.json().get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Could not verify your account.")
    return user_id


def enforce_quota(user_id: str, feature: str) -> None:
    """Atomically count this use; raise 429 once the daily limit is exceeded."""
    limit = DAILY_LIMITS[feature]
    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/increment_api_usage",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json",
        },
        json={"p_user_id": user_id, "p_feature": feature},
        timeout=15,
    )
    if not resp.ok:
        # Fail open: a broken usage table should not take down the feature.
        return
    if int(resp.text or 0) > limit:
        raise HTTPException(
            status_code=429,
            detail=f"Daily limit reached ({limit} {feature} checks/day). Resets at midnight UTC.",
        )


def cache_key(feature: str, *parts: str) -> str:
    normalized = "|".join(" ".join(p.lower().split()) for p in parts)
    return hashlib.sha256(f"{feature}:{normalized}".encode()).hexdigest()


def get_cached(key: str) -> Any | None:
    try:
        result = get_supabase().table("llm_cache").select("response").eq("cache_key", key).single().execute()
        return result.data["response"] if result.data else None
    except Exception:  # noqa: BLE001 — cache is best-effort
        return None


def set_cached(key: str, feature: str, response: Any) -> None:
    try:
        get_supabase().table("llm_cache").upsert(
            {"cache_key": key, "feature": feature, "response": response},
            on_conflict="cache_key",
        ).execute()
    except Exception:  # noqa: BLE001 — cache is best-effort
        pass
