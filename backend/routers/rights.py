import logging
from fastapi import APIRouter, HTTPException, Request
from models.schemas import RightsAnswerResponse, RightsQuestionRequest
from services.logging_service import log_event
from services.location_service import US_STATES
from services.rag_service import ask_tenant_rights, get_rights_coverage, select_rights_sources
from services.rights_registry import RIGHTS_SUPPORTED_STATES
from services.usage_service import cache_key, enforce_quota, get_cached, require_user, set_cached

router = APIRouter()
logger = logging.getLogger("rentpilot")


@router.post("/ask", response_model=RightsAnswerResponse)
async def ask_rights(body: RightsQuestionRequest, request: Request):
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    if body.state not in US_STATES:
        raise HTTPException(status_code=400, detail=f"Invalid state: {body.state}")

    user_id = require_user(request)
    log_event(logger, "rights_question_requested", user_id=user_id, state=body.state)

    if body.state not in RIGHTS_SUPPORTED_STATES:
        result = ask_tenant_rights(body.question, body.state)
        log_event(
            logger,
            "rights_question_completed",
            user_id=user_id,
            state=body.state,
            refused=result.get("refused"),
            supported_state=result.get("supported_state"),
            source_count=len(result.get("sources") or []),
        )
        return result

    sources = select_rights_sources(body.question, body.state)
    if not sources:
        result = ask_tenant_rights(body.question, body.state, sources)
        log_event(
            logger,
            "rights_question_completed",
            user_id=user_id,
            state=body.state,
            refused=result.get("refused"),
            supported_state=result.get("supported_state"),
            source_count=0,
        )
        return result

    # Common questions repeat on a campus — serve them from cache for free.
    key = cache_key("rights", body.state, body.question)
    cached = get_cached(key)
    if cached is not None:
        log_event(
            logger,
            "rights_question_cache_hit",
            user_id=user_id,
            state=body.state,
            source_count=len(cached.get("sources") or []),
        )
        return cached

    enforce_quota(user_id, "rights")
    result = ask_tenant_rights(body.question, body.state, sources)
    set_cached(key, "rights", result)
    log_event(
        logger,
        "rights_question_completed",
        user_id=user_id,
        state=body.state,
        refused=result.get("refused"),
        supported_state=result.get("supported_state"),
        source_count=len(result.get("sources") or []),
    )
    return result


@router.get("/states")
async def get_states():
    """Returns all states plus the launch coverage subset."""
    return get_rights_coverage()
