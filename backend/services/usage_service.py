"""Auth verification, per-user daily quotas, and LLM response caching.

Design:
- require_user()  — hard 401 if no valid JWT (used by Match social endpoints).
- optional_user() — returns user_id or None; core tool endpoints use this so
                    anonymous visitors can run analyses without signing up.
- enforce_quota() — only called for authenticated users; anonymous traffic is
                    naturally bounded by the LLM cache (identical inputs are
                    served for free) and by OpenAI rate limits upstream.
                    IP-based rate limiting is intentionally left to infrastructure
                    (Cloudflare / nginx) rather than application code — university
                    campuses share IP addresses and per-IP limits break the UX.
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


def _validate_jwt(token: str) -> str | None:
    """Validate a Supabase JWT and return the user id, or None on failure."""
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {token}"},
            timeout=15,
        )
        if not resp.ok:
            return None
        return resp.json().get("id") or None
    except Exception:  # noqa: BLE001
        return None


def require_user(request: Request) -> str:
    """Validate the Supabase JWT and return user_id — raises 401 if absent or invalid.

    Use for endpoints that are inherently identity-dependent (Match messaging,
    posting, profile management).
    """
    auth_header = request.headers.get("authorization", "")
    if not auth_header.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Log in to use this feature.")
    token = auth_header.split(" ", 1)[1]
    user_id = _validate_jwt(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    return user_id


def optional_user(request: Request) -> str | None:
    """Return user_id if a valid JWT is present, otherwise None.

    Use for core tool endpoints (Lease Analyzer, Scam Checker, Tenant Rights)
    so anonymous visitors can use the product without signing up. When user_id
    is None, callers should skip DB history saves and quota enforcement — the
    LLM response cache still applies, so repeated anonymous queries are free.
    """
    auth_header = request.headers.get("authorization", "")
    if not auth_header.lower().startswith("bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    return _validate_jwt(token)


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
