import logging
from datetime import date
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request
from database import get_supabase
from models.schemas import MessageCreate, ReportCreate, SeekerPostCreate, SpacePostCreate
from services.logging_service import log_event
from services.location_service import US_STATES, normalize_city, normalize_optional_text, normalize_state
from services.match_service import explain_match, find_matches_for_seeker, find_matches_for_space, summarize_match
from services.security_service import check_toxicity, redact_contact_details
from services.usage_service import require_user

router = APIRouter()
logger = logging.getLogger("rentpilot")
REPORT_TARGET_TABLES = {
    "space_post": "space_posts",
    "seeker_post": "seeker_posts",
    "match": "matches",
}
REDACTION_NOTICE = "Contact details were removed to keep communication on RentPilot until both sides feel safe."


def _auth_token(request: Request) -> str | None:
    auth_header = request.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        return auth_header.split(" ", 1)[1]
    return None


def _poster_summaries(supabase, user_ids: list[str]) -> dict[str, dict]:
    """Public-safe poster info: name + student verification, never the email."""
    if not user_ids:
        return {}
    rows = (
        supabase.table("profiles")
        .select("id,full_name,email,school,campus")
        .in_("id", list(set(user_ids)))
        .execute()
        .data
        or []
    )
    return {
        row["id"]: {
            "id": row["id"],
            "full_name": row.get("full_name") or "RentPilot user",
            "school": row.get("school"),
            "campus": row.get("campus"),
            "is_student_verified": (row.get("email") or "").lower().endswith(".edu"),
        }
        for row in rows
    }


def _validate_space_payload(payload: dict) -> None:
    if not payload["city"]:
        raise HTTPException(status_code=400, detail="City is required.")
    if payload["state"] not in US_STATES:
        raise HTTPException(status_code=400, detail="Select a valid US state.")
    if float(payload["total_rent"]) <= 0:
        raise HTTPException(status_code=400, detail="Total apartment rent must be greater than 0.")
    if float(payload["your_share"]) <= 0:
        raise HTTPException(status_code=400, detail="Roommate share must be greater than 0.")
    if float(payload["your_share"]) > float(payload["total_rent"]):
        raise HTTPException(status_code=400, detail="Roommate share cannot be higher than total rent.")
    if int(payload["rooms_available"]) < 1:
        raise HTTPException(status_code=400, detail="Rooms available must be at least 1.")


def _validate_seeker_payload(payload: dict) -> None:
    if not payload["city"]:
        raise HTTPException(status_code=400, detail="City is required.")
    if payload["state"] not in US_STATES:
        raise HTTPException(status_code=400, detail="Select a valid US state.")
    if float(payload["budget_min"]) <= 0:
        raise HTTPException(status_code=400, detail="Minimum budget must be greater than 0.")
    if float(payload["budget_max"]) <= 0:
        raise HTTPException(status_code=400, detail="Maximum budget must be greater than 0.")
    if float(payload["budget_max"]) < float(payload["budget_min"]):
        raise HTTPException(status_code=400, detail="Maximum budget cannot be lower than minimum budget.")


def _normalize_space_payload(body: SpacePostCreate) -> dict:
    payload = body.model_dump(mode="json")
    payload["city"] = normalize_city(body.city)
    payload["state"] = normalize_state(body.state)
    payload["zip"] = normalize_optional_text(body.zip)
    description = normalize_optional_text(body.description)
    notice = None
    if description:
        description, removed = redact_contact_details(description)
        if removed:
            notice = REDACTION_NOTICE
    payload["description"] = description
    return payload, notice


def _normalize_seeker_payload(body: SeekerPostCreate) -> dict:
    payload = body.model_dump(mode="json")
    payload["city"] = normalize_city(body.city)
    payload["state"] = normalize_state(body.state)
    bio = normalize_optional_text(body.bio)
    notice = None
    if bio:
        bio, removed = redact_contact_details(bio)
        if removed:
            notice = REDACTION_NOTICE
    payload["bio"] = bio
    return payload, notice


def _sanitize_public_text(value: str | None) -> str | None:
    if not value:
        return value
    sanitized, _ = redact_contact_details(value)
    return sanitized


def _date_matches(value: str | None, move_in_by: date | None) -> bool:
    if move_in_by is None or not value:
        return True
    try:
        return date.fromisoformat(str(value)) <= move_in_by
    except ValueError:
        return False


def _space_matches_filters(space: dict, budget: float | None, furnished: bool | None, parking: bool | None,
                           laundry: bool | None, pets: bool | None, ac: bool | None, move_in_by: date | None) -> bool:
    if budget is not None and float(space.get("your_share") or 0) > budget:
        return False
    if furnished and not space.get("is_furnished"):
        return False
    if parking and not space.get("has_parking"):
        return False
    if laundry and not space.get("has_laundry"):
        return False
    if pets and not space.get("pets_allowed"):
        return False
    if ac and not space.get("has_ac"):
        return False
    if not _date_matches(space.get("move_in_date"), move_in_by):
        return False
    return True


def _seeker_matches_filters(seeker: dict, budget: float | None, furnished: bool | None, parking: bool | None,
                            laundry: bool | None, pets: bool | None, ac: bool | None, move_in_by: date | None) -> bool:
    if budget is not None:
        if float(seeker.get("budget_min") or 0) > budget or float(seeker.get("budget_max") or 0) < budget:
            return False
    if furnished and not seeker.get("needs_furnished"):
        return False
    if parking and not seeker.get("needs_parking"):
        return False
    if laundry and not seeker.get("needs_laundry"):
        return False
    if pets and not seeker.get("needs_pets_allowed"):
        return False
    if ac and not seeker.get("needs_ac"):
        return False
    if not _date_matches(seeker.get("move_in_date"), move_in_by):
        return False
    return True


@router.post("/spaces")
async def create_space_post(body: SpacePostCreate, request: Request):
    auth_user_id = require_user(request)
    if body.poster_id != auth_user_id:
        raise HTTPException(status_code=403, detail="You can only create space posts for your own account.")

    # Toxicity check on description
    if getattr(body, "description", None):
        toxicity = check_toxicity(body.description)
        if toxicity["is_toxic"]:
            raise HTTPException(status_code=400, detail=f"Post rejected: {toxicity['reason']}")

    payload, moderation_notice = _normalize_space_payload(body)
    _validate_space_payload(payload)

    supabase = get_supabase()
    insert_result = supabase.table("space_posts").insert(payload).execute()
    if not insert_result.data:
        raise HTTPException(status_code=500, detail="Failed to create space post")

    space_post = insert_result.data[0]
    seekers = supabase.table("seeker_posts").select("*").eq("is_active", True).execute().data or []

    matches = find_matches_for_space(space_post, seekers)
    for match in matches:
        supabase.table("matches").upsert(
            {
                "space_post_id": space_post["id"],
                "seeker_post_id": match["seeker_post_id"],
                "score": match["score"],
            },
            on_conflict="space_post_id,seeker_post_id",
        ).execute()

    log_event(
        logger,
        "match_space_post_created",
        user_id=auth_user_id,
        city=payload["city"],
        state=payload["state"],
        match_count=len(matches),
        moderation_notice=bool(moderation_notice),
    )
    return {"space_post": space_post, "matches": matches, "moderation_notice": moderation_notice}


@router.post("/seekers")
async def create_seeker_post(body: SeekerPostCreate, request: Request):
    auth_user_id = require_user(request)
    if body.seeker_id != auth_user_id:
        raise HTTPException(status_code=403, detail="You can only create seeker posts for your own account.")

    # Toxicity check on bio
    if getattr(body, "bio", None):
        toxicity = check_toxicity(body.bio)
        if toxicity["is_toxic"]:
            raise HTTPException(status_code=400, detail=f"Post rejected: {toxicity['reason']}")

    payload, moderation_notice = _normalize_seeker_payload(body)
    _validate_seeker_payload(payload)

    supabase = get_supabase()
    insert_result = supabase.table("seeker_posts").insert(payload).execute()
    if not insert_result.data:
        raise HTTPException(status_code=500, detail="Failed to create seeker post")

    seeker_post = insert_result.data[0]
    spaces = supabase.table("space_posts").select("*").eq("is_active", True).execute().data or []

    matches = find_matches_for_seeker(seeker_post, spaces)
    for match in matches:
        supabase.table("matches").upsert(
            {
                "space_post_id": match["space_post_id"],
                "seeker_post_id": seeker_post["id"],
                "score": match["score"],
            },
            on_conflict="space_post_id,seeker_post_id",
        ).execute()

    log_event(
        logger,
        "match_seeker_post_created",
        user_id=auth_user_id,
        city=payload["city"],
        state=payload["state"],
        match_count=len(matches),
        moderation_notice=bool(moderation_notice),
    )
    return {"seeker_post": seeker_post, "matches": matches, "moderation_notice": moderation_notice}


@router.get("/spaces")
async def list_space_posts(
    request: Request,
    city: str | None = None,
    state: str | None = None,
    max_rent: float | None = None,
    budget: float | None = None,
    furnished: bool | None = None,
    parking: bool | None = None,
    laundry: bool | None = None,
    pets: bool | None = None,
    ac: bool | None = None,
    move_in_by: date | None = None,
):
    supabase = get_supabase(_auth_token(request))
    query = supabase.table("space_posts").select("*").eq("is_active", True)
    budget_cap = budget if budget is not None else max_rent

    if city:
        query = query.ilike("city", normalize_city(city))
    if state:
        query = query.ilike("state", normalize_state(state) or state)

    results = query.execute().data or []
    results = [
        row for row in results
        if _space_matches_filters(row, budget_cap, furnished, parking, laundry, pets, ac, move_in_by)
    ]
    posters = _poster_summaries(supabase, [r["poster_id"] for r in results if r.get("poster_id")])
    for row in results:
        row["description"] = _sanitize_public_text(row.get("description"))
        row["poster"] = posters.get(row.get("poster_id"))
    return {"spaces": results}


@router.get("/spaces/{space_id}")
async def get_space_post(space_id: str, request: Request):
    supabase = get_supabase(_auth_token(request))
    result = supabase.table("space_posts").select("*").eq("id", space_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Space post not found")
    space = result.data
    space["description"] = _sanitize_public_text(space.get("description"))
    space["poster"] = _poster_summaries(supabase, [space.get("poster_id")]).get(space.get("poster_id"))
    return space


@router.get("/seekers")
async def list_seeker_posts(
    request: Request,
    city: str | None = None,
    state: str | None = None,
    budget: float | None = None,
    furnished: bool | None = None,
    parking: bool | None = None,
    laundry: bool | None = None,
    pets: bool | None = None,
    ac: bool | None = None,
    move_in_by: date | None = None,
):
    supabase = get_supabase(_auth_token(request))
    query = supabase.table("seeker_posts").select("*").eq("is_active", True)

    if city:
        query = query.ilike("city", normalize_city(city))
    if state:
        query = query.ilike("state", normalize_state(state) or state)

    results = query.execute().data or []
    results = [
        row for row in results
        if _seeker_matches_filters(row, budget, furnished, parking, laundry, pets, ac, move_in_by)
    ]
    seekers_profiles = _poster_summaries(supabase, [r["seeker_id"] for r in results if r.get("seeker_id")])
    for row in results:
        row["bio"] = _sanitize_public_text(row.get("bio"))
        row["seeker"] = seekers_profiles.get(row.get("seeker_id"))
    return {"seekers": results}


@router.get("/seekers/{seeker_id}")
async def get_seeker_post(seeker_id: str, request: Request):
    supabase = get_supabase(_auth_token(request))
    result = supabase.table("seeker_posts").select("*").eq("id", seeker_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Seeker post not found")
    seeker = result.data
    seeker["bio"] = _sanitize_public_text(seeker.get("bio"))
    seeker["seeker"] = _poster_summaries(supabase, [seeker.get("seeker_id")]).get(seeker.get("seeker_id"))
    return seeker


@router.get("/my-matches/{user_id}")
async def get_my_matches(user_id: str, request: Request):
    auth_user_id = require_user(request)
    if user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="You can only view your own matches.")

    supabase = get_supabase()

    space_posts = supabase.table("space_posts").select("id").eq("poster_id", user_id).execute().data or []
    seeker_posts = supabase.table("seeker_posts").select("id").eq("seeker_id", user_id).execute().data or []

    space_ids = [row["id"] for row in space_posts]
    seeker_ids = [row["id"] for row in seeker_posts]

    # A user with no posts has no matches. (Previously this fell through to
    # an unfiltered query that returned every match in the database.)
    if not space_ids and not seeker_ids:
        return {"matches": []}

    # Matches where the user is the space poster OR the seeker. Two queries
    # because combining .in_ filters on one query ANDs them.
    matches_by_id: dict[str, dict] = {}
    if space_ids:
        rows = supabase.table("matches").select("*").in_("space_post_id", space_ids).execute().data or []
        matches_by_id.update({row["id"]: row for row in rows})
    if seeker_ids:
        rows = supabase.table("matches").select("*").in_("seeker_post_id", seeker_ids).execute().data or []
        matches_by_id.update({row["id"]: row for row in rows})

    matches = list(matches_by_id.values())

    space_map = {}
    seeker_map = {}

    if matches:
        match_space_ids = list({m["space_post_id"] for m in matches})
        match_seeker_ids = list({m["seeker_post_id"] for m in matches})

        if match_space_ids:
            spaces = supabase.table("space_posts").select("*").in_("id", match_space_ids).execute().data or []
            space_map = {space["id"]: space for space in spaces}

        if match_seeker_ids:
            seekers = supabase.table("seeker_posts").select("*").in_("id", match_seeker_ids).execute().data or []
            seeker_map = {seeker["id"]: seeker for seeker in seekers}

    enriched = []
    for match in matches:
        space_post = space_map.get(match["space_post_id"])
        seeker_post = seeker_map.get(match["seeker_post_id"])
        # Skip matches pointing at deleted/missing posts so the frontend
        # never receives a null space_post/seeker_post.
        if not space_post or not seeker_post:
            continue
        breakdown = explain_match(space_post, seeker_post)
        enriched.append({
            **match,
            "space_post": space_post,
            "seeker_post": seeker_post,
            "breakdown": breakdown,
            "summary": summarize_match(space_post, seeker_post, breakdown),
        })

    enriched.sort(key=lambda m: m.get("score", 0), reverse=True)
    return {"matches": enriched}


def _match_participants(supabase, match_id: str) -> tuple[dict, str, str]:
    """Return (match, poster_user_id, seeker_user_id) or raise 404."""
    match = supabase.table("matches").select("*").eq("id", match_id).single().execute().data
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    space = supabase.table("space_posts").select("poster_id").eq("id", match["space_post_id"]).single().execute().data
    seeker = supabase.table("seeker_posts").select("seeker_id").eq("id", match["seeker_post_id"]).single().execute().data
    if not space or not seeker:
        raise HTTPException(status_code=404, detail="Match posts not found")
    return match, space["poster_id"], seeker["seeker_id"]


@router.get("/{match_id}/messages")
async def list_messages(match_id: str, request: Request):
    user_id = require_user(request)
    supabase = get_supabase()
    _, poster_id, seeker_id = _match_participants(supabase, match_id)
    if user_id not in (poster_id, seeker_id):
        raise HTTPException(status_code=403, detail="You are not part of this match.")

    messages = supabase.table("messages").select("*").eq("match_id", match_id).execute().data or []
    for message in messages:
        message["content"] = _sanitize_public_text(message.get("content")) or ""
    messages.sort(key=lambda m: m.get("created_at") or "")
    return {"messages": messages, "me": user_id}


@router.post("/{match_id}/messages")
async def send_message(match_id: str, body: MessageCreate, request: Request):
    user_id = require_user(request)
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    toxicity = check_toxicity(body.content)
    if toxicity["is_toxic"]:
        raise HTTPException(status_code=400, detail=f"Message rejected: {toxicity['reason']}")

    content, removed = redact_contact_details(body.content.strip())
    moderation_notice = REDACTION_NOTICE if removed else None

    supabase = get_supabase()
    _, poster_id, seeker_id = _match_participants(supabase, match_id)
    if user_id not in (poster_id, seeker_id):
        raise HTTPException(status_code=403, detail="You are not part of this match.")

    result = supabase.table("messages").insert(
        {"match_id": match_id, "sender_id": user_id, "content": content}
    ).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to send message")
    message = result.data[0]
    message["moderation_notice"] = moderation_notice
    log_event(
        logger,
        "match_message_sent",
        user_id=user_id,
        match_id=match_id,
        moderation_notice=bool(moderation_notice),
        content_chars=len(content),
    )
    return message


@router.post("/reports")
async def create_report(body: ReportCreate, request: Request):
    reporter_id = require_user(request)
    target_type = normalize_optional_text(body.target_type)
    reason = normalize_optional_text(body.reason)
    details = normalize_optional_text(body.details)

    if target_type not in REPORT_TARGET_TABLES:
        raise HTTPException(status_code=400, detail="Invalid report target.")
    if not reason:
        raise HTTPException(status_code=400, detail="Report reason is required.")

    try:
        target_uuid = str(UUID(body.target_id))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid report target id.") from exc

    supabase = get_supabase()
    target = supabase.table(REPORT_TARGET_TABLES[target_type]).select("id").eq("id", target_uuid).single().execute().data
    if not target:
        raise HTTPException(status_code=404, detail="The item you are reporting was not found.")

    result = supabase.table("reports").insert(
        {
            "reporter_id": reporter_id,
            "target_type": target_type,
            "target_id": target_uuid,
            "reason": reason,
            "details": details,
        }
    ).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to submit report")
    log_event(
        logger,
        "match_report_submitted",
        reporter_id=reporter_id,
        target_type=target_type,
        target_id=target_uuid,
        has_details=bool(details),
    )
    return {"report": result.data[0], "message": "Report submitted. Our review queue has it."}
