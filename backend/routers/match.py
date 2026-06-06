from fastapi import APIRouter, HTTPException
from database import get_supabase
from models.schemas import SeekerPostCreate, SpacePostCreate
from services.match_service import find_matches_for_seeker, find_matches_for_space

router = APIRouter()


@router.post("/spaces")
async def create_space_post(body: SpacePostCreate):
    supabase = get_supabase()
    insert_result = supabase.table("space_posts").insert(body.model_dump()).execute()
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
async def create_seeker_post(body: SeekerPostCreate):
    supabase = get_supabase()
    insert_result = supabase.table("seeker_posts").insert(body.model_dump()).execute()
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
async def list_space_posts(city: str | None = None, state: str | None = None, max_rent: float | None = None):
    supabase = get_supabase()
    query = supabase.table("space_posts").select("*").eq("is_active", True)

    if city:
        query = query.ilike("city", city)
    if state:
        query = query.ilike("state", state)
    if max_rent is not None:
        query = query.lte("your_share", max_rent)

    results = query.execute().data or []
    return {"spaces": results}


@router.get("/spaces/{space_id}")
async def get_space_post(space_id: str):
    supabase = get_supabase()
    result = supabase.table("space_posts").select("*").eq("id", space_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Space post not found")
    return result.data


@router.get("/seekers")
async def list_seeker_posts(city: str | None = None, state: str | None = None):
    supabase = get_supabase()
    query = supabase.table("seeker_posts").select("*").eq("is_active", True)

    if city:
        query = query.ilike("city", city)
    if state:
        query = query.ilike("state", state)

    results = query.execute().data or []
    return {"seekers": results}


@router.get("/seekers/{seeker_id}")
async def get_seeker_post(seeker_id: str):
    supabase = get_supabase()
    result = supabase.table("seeker_posts").select("*").eq("id", seeker_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Seeker post not found")
    return result.data


@router.get("/my-matches/{user_id}")
async def get_my_matches(user_id: str):
    supabase = get_supabase()

    space_posts = supabase.table("space_posts").select("id").eq("poster_id", user_id).execute().data or []
    seeker_posts = supabase.table("seeker_posts").select("id").eq("seeker_id", user_id).execute().data or []

    space_ids = [row["id"] for row in space_posts]
    seeker_ids = [row["id"] for row in seeker_posts]

    query = supabase.table("matches").select("*")
    if space_ids:
        query = query.in_("space_post_id", space_ids)
    if seeker_ids:
        query = query.in_("seeker_post_id", seeker_ids)

    matches = query.execute().data or []

    space_map = {}
    seeker_map = {}

    if matches:
        space_ids = list({m["space_post_id"] for m in matches})
        seeker_ids = list({m["seeker_post_id"] for m in matches})

        if space_ids:
            spaces = supabase.table("space_posts").select("*").in_("id", space_ids).execute().data or []
            space_map = {space["id"]: space for space in spaces}

        if seeker_ids:
            seekers = supabase.table("seeker_posts").select("*").in_("id", seeker_ids).execute().data or []
            seeker_map = {seeker["id"]: seeker for seeker in seekers}

    enriched = []
    for match in matches:
        enriched.append(
            {
                **match,
                "space_post": space_map.get(match["space_post_id"]),
                "seeker_post": seeker_map.get(match["seeker_post_id"]),
            }
        )

    return {"matches": enriched}
