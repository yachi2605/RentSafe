from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from services.rag_service import ask_tenant_rights, US_STATES
from services.usage_service import cache_key, enforce_quota, get_cached, require_user, set_cached

router = APIRouter()


class RightsRequest(BaseModel):
    question: str
    state: str


@router.post("/ask")
async def ask_rights(body: RightsRequest, request: Request):
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    if body.state not in US_STATES:
        raise HTTPException(status_code=400, detail=f"Invalid state: {body.state}")

    user_id = require_user(request)

    # Common questions repeat on a campus — serve them from cache for free.
    key = cache_key("rights", body.state, body.question)
    cached = get_cached(key)
    if cached is not None:
        return cached

    enforce_quota(user_id, "rights")
    result = ask_tenant_rights(body.question, body.state)
    set_cached(key, "rights", result)
    return result


@router.get("/states")
async def get_states():
    """Returns list of all US states for the frontend state selector dropdown."""
    return {"states": US_STATES}
