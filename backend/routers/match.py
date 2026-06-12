from fastapi import APIRouter, HTTPException, Request
from database import get_supabase
from models.schemas import MessageCreate, SeekerPostCreate, SpacePostCreate
from services.match_service import explain_match, find_matches_for_seeker, find_matches_for_space
from services.usage_service import require_user

router = APIRouter()


def _auth_token(request: Request) -> str | None:
    auth_header = request.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        return auth_header.split(" ", 1)[1]
    return None


def _poster_summaries(supabase, user_ids: list[str]) -> dict[str, dict]:
    """Public-safe poster info: name + student verification, never the email."""
    if not user_ids:
        return {}
    rows = supabase.table("profiles").select("id,full_name,email").in_("id", list(set(user_ids))).execute().data or []
    return {
        row["id"]: {
            "id": row["id"],
            "full_name": row.get("full_name") or "RentSafe user",
            "is_student_verified": (row.get("email") or "").lower().endswith(".edu"),
        }
        for row in rows
    }


@router.post("/spaces")
async def create_space_post(body: SpacePostCreate, request: Request):
    # Toxicity check on description
    if getattr(body, "description", None):
        from services.security_service import check_toxicity

        toxicity = check_toxicity(body.description)
        if toxicity["is_toxic"]:
            raise HTTPException(status_code=400, detail=f"Post rejected: {toxicity['reason']}")

    supabase = get_supabase(_auth_token(request))
    insert_result = supabase.table("space_posts").insert(body.model_dump(mode="json")).execute()
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

    return {"space_post": space_post, "matches": matches}


@router.post("/seekers")
async def create_seeker_post(body: SeekerPostCreate, request: Request):
    # Toxicity check on bio
    if getattr(body, "bio", None):
        from services.security_service import check_toxicity

        toxicity = check_toxicity(body.bio)
        if toxicity["is_toxic"]:
            raise HTTPException(status_code=400, detail=f"Post rejected: {toxicity['reason']}")

    supabase = get_supabase(_auth_token(request))
    insert_result = supabase.table("seeker_posts").insert(body.model_dump(mode="json")).execute()
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

    return {"seeker_post": seeker_post, "matches": matches}


@router.get("/spaces")
async def list_space_posts(request: Request, city: str | None = None, state: str | None = None, max_rent: float | None = None):
    supabase = get_supabase(_auth_token(request))
    query = supabase.table("space_posts").select("*").eq("is_active", True)

    if city:
        query = query.ilike("city", city)
    if state:
        query = query.ilike("state", state)
    if max_rent is not None:
        query = query.lte("your_share", max_rent)

    results = query.execute().data or []
    posters = _poster_summaries(supabase, [r["poster_id"] for r in results if r.get("poster_id")])
    for row in results:
        row["poster"] = posters.get(row.get("poster_id"))
    return {"spaces": results}


@router.get("/spaces/{space_id}")
async def get_space_post(space_id: str, request: Request):
    supabase = get_supabase(_auth_token(request))
    result = supabase.table("space_posts").select("*").eq("id", space_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Space post not found")
    return result.data


@router.get("/seekers")
async def list_seeker_posts(request: Request, city: str | None = None, state: str | None = None):
    supabase = get_supabase(_auth_token(request))
    query = supabase.table("seeker_posts").select("*").eq("is_active", True)

    if city:
        query = query.ilike("city", city)
    if state:
        query = query.ilike("state", state)

    results = query.execute().data or []
    seekers_profiles = _poster_summaries(supabase, [r["seeker_id"] for r in results if r.get("seeker_id")])
    for row in results:
        row["seeker"] = seekers_profiles.get(row.get("seeker_id"))
    return {"seekers": results}


@router.get("/seekers/{seeker_id}")
async def get_seeker_post(seeker_id: str, request: Request):
    supabase = get_supabase(_auth_token(request))
    result = supabase.table("seeker_posts").select("*").eq("id", seeker_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Seeker post not found")
    return result.data


@router.get("/my-matches/{user_id}")
async def get_my_matches(user_id: str, request: Request):
    supabase = get_supabase(_auth_token(request))

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
        enriched.append({
            **match,
            "space_post": space_post,
            "seeker_post": seeker_post,
            "breakdown": explain_match(space_post, seeker_post),
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
    messages.sort(key=lambda m: m.get("created_at") or "")
    return {"messages": messages, "me": user_id}


@router.post("/{match_id}/messages")
async def send_message(match_id: str, body: MessageCreate, request: Request):
    user_id = require_user(request)
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    from services.security_service import check_toxicity

    toxicity = check_toxicity(body.content)
    if toxicity["is_toxic"]:
        raise HTTPException(status_code=400, detail=f"Message rejected: {toxicity['reason']}")

    supabase = get_supabase()
    _, poster_id, seeker_id = _match_participants(supabase, match_id)
    if user_id not in (poster_id, seeker_id):
        raise HTTPException(status_code=403, detail="You are not part of this match.")

    result = supabase.table("messages").insert(
        {"match_id": match_id, "sender_id": user_id, "content": body.content.strip()}
    ).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to send message")
    return result.data[0]
