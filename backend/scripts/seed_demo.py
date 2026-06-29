"""Seed demo users and posts so RentPilot has data to demo.

Usage (backend running on :8000, backend/.env configured):

    cd backend
    python scripts/seed_demo.py

Creates 4 confirmed demo accounts (password: RentPilotDemo1!) and posts
spaces/seekers through the live API so the matching engine runs for real.
Safe to re-run: existing demo users are reused, posts are re-created.
"""
import os
import sys

import requests
from dotenv import load_dotenv

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
PASSWORD = "RentPilotDemo1!"

ADMIN_HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
}

DEMO_USERS = [
    {
        "email": "demo.poster1@rentpilot.app",
        "full_name": "Priya Sharma",
        "school": "Illinois Institute of Technology",
        "campus": "Mies Campus",
        "preferred_city": "Chicago",
        "preferred_state": "Illinois",
        "budget_goal_max": 1200,
        "preferred_move_in_date": "2026-08-01",
        "prefers_laundry": True,
        "prefers_ac": True,
    },
    {
        "email": "demo.poster2@rentpilot.app",
        "full_name": "Marcus Lee",
        "school": "University of Illinois Chicago",
        "campus": "West Campus",
        "preferred_city": "Chicago",
        "preferred_state": "Illinois",
        "budget_goal_max": 1000,
        "preferred_move_in_date": "2026-07-15",
        "prefers_parking": True,
        "prefers_pets": True,
    },
    {
        "email": "demo.seeker1@rentpilot.app",
        "full_name": "Ana Torres",
        "school": "Illinois Institute of Technology",
        "campus": "Mies Campus",
        "preferred_city": "Chicago",
        "preferred_state": "Illinois",
        "budget_goal_min": 800,
        "budget_goal_max": 1200,
        "preferred_move_in_date": "2026-08-01",
        "prefers_furnished": True,
        "prefers_laundry": True,
        "prefers_ac": True,
    },
    {
        "email": "demo.seeker2@rentpilot.app",
        "full_name": "Dev Patel",
        "school": "University of Illinois Chicago",
        "campus": "East Campus",
        "preferred_city": "Chicago",
        "preferred_state": "Illinois",
        "budget_goal_min": 700,
        "budget_goal_max": 1000,
        "preferred_move_in_date": "2026-07-15",
        "prefers_parking": True,
        "prefers_pets": True,
        "prefers_ac": True,
    },
]


def get_or_create_user(email: str, full_name: str) -> str:
    """Create a confirmed auth user via the admin API; return its id."""
    resp = requests.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        headers=ADMIN_HEADERS,
        json={
            "email": email,
            "password": PASSWORD,
            "email_confirm": True,
            "user_metadata": {"full_name": full_name},
        },
        timeout=30,
    )
    if resp.ok:
        return resp.json()["id"]

    # Already exists — look it up.
    lookup = requests.get(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        headers=ADMIN_HEADERS,
        params={"page": 1, "per_page": 1000},
        timeout=30,
    )
    lookup.raise_for_status()
    for user in lookup.json().get("users", []):
        if user.get("email") == email:
            return user["id"]
    raise RuntimeError(f"Could not create or find user {email}: {resp.text}")


def ensure_profile(user_id: str, user: dict) -> None:
    requests.post(
        f"{SUPABASE_URL}/rest/v1/profiles",
        headers={**ADMIN_HEADERS, "Prefer": "resolution=merge-duplicates"},
        json={
            "id": user_id,
            "email": user["email"],
            "full_name": user["full_name"],
            "school": user.get("school"),
            "campus": user.get("campus"),
            "preferred_city": user.get("preferred_city"),
            "preferred_state": user.get("preferred_state"),
            "budget_goal_min": user.get("budget_goal_min"),
            "budget_goal_max": user.get("budget_goal_max"),
            "preferred_move_in_date": user.get("preferred_move_in_date"),
            "prefers_furnished": user.get("prefers_furnished", False),
            "prefers_parking": user.get("prefers_parking", False),
            "prefers_laundry": user.get("prefers_laundry", False),
            "prefers_pets": user.get("prefers_pets", False),
            "prefers_ac": user.get("prefers_ac", False),
            "tos_accepted": True,
        },
        timeout=30,
    ).raise_for_status()


def login_user(email: str) -> str:
    resp = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": SERVICE_KEY, "Content-Type": "application/json"},
        json={"email": email, "password": PASSWORD},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def post(path: str, payload: dict, token: str) -> dict:
    resp = requests.post(
        f"{BACKEND_URL}{path}",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
        timeout=120,
    )
    if not resp.ok:
        raise RuntimeError(f"POST {path} failed ({resp.status_code}): {resp.text}")
    return resp.json()


def main() -> None:
    print("Creating demo users...")
    ids = {}
    tokens = {}
    for user in DEMO_USERS:
        uid = get_or_create_user(user["email"], user["full_name"])
        ensure_profile(uid, user)
        tokens[user["email"]] = login_user(user["email"])
        ids[user["email"]] = uid
        print(f"  {user['full_name']:<14} {user['email']:<28} {uid}")

    print("\nPosting spaces (via API so matching runs)...")
    spaces = [
        {
            "poster_id": ids["demo.poster1@rentpilot.app"],
            "city": "Chicago", "state": "Illinois", "zip": "60616",
            "apartment_type": "2bhk", "total_rent": 2200, "your_share": 1100,
            "rooms_available": 1, "lease_type": "existing", "lease_duration": "long_term",
            "move_in_date": "2026-08-01",
            "is_furnished": True, "has_parking": False, "has_laundry": True,
            "pets_allowed": False, "has_ac": True, "utilities_included": True,
            "pref_cleanliness": 4, "pref_noise_tolerance": 2, "pref_guests_frequency": 2,
            "pref_smoking_ok": False, "pref_schedule": "early_bird", "pref_gender": "any",
            "description": "Bright 2BHK near IIT campus, 5 min walk to the Green Line. Looking for a tidy, quiet roommate.",
        },
        {
            "poster_id": ids["demo.poster2@rentpilot.app"],
            "city": "Chicago", "state": "Illinois", "zip": "60607",
            "apartment_type": "3bhk", "total_rent": 3000, "your_share": 950,
            "rooms_available": 2, "lease_type": "new_cosign", "lease_duration": "flexible",
            "move_in_date": "2026-07-15",
            "is_furnished": False, "has_parking": True, "has_laundry": True,
            "pets_allowed": True, "has_ac": True, "utilities_included": False,
            "pref_cleanliness": 3, "pref_noise_tolerance": 4, "pref_guests_frequency": 4,
            "pref_smoking_ok": False, "pref_schedule": "night_owl", "pref_gender": "any",
            "description": "Spacious UIC-area 3BHK, pet friendly, garage parking. Social house, guests welcome.",
        },
    ]
    for space in spaces:
        token = tokens["demo.poster1@rentpilot.app"] if space["poster_id"] == ids["demo.poster1@rentpilot.app"] else tokens["demo.poster2@rentpilot.app"]
        result = post("/match/spaces", space, token)
        print(f"  space in {space['city']} (${space['your_share']}/mo) -> {len(result['matches'])} match(es)")

    print("\nPosting seekers (via API so matching runs)...")
    seekers = [
        {
            "seeker_id": ids["demo.seeker1@rentpilot.app"],
            "city": "Chicago", "state": "Illinois",
            "budget_min": 800, "budget_max": 1200, "move_in_date": "2026-08-01",
            "lease_duration": "long_term",
            "cleanliness": 4, "noise_level": 2, "guests_frequency": 2,
            "smoking": False, "schedule": "early_bird", "gender": "female",
            "needs_furnished": True, "needs_parking": False, "needs_laundry": True,
            "needs_pets_allowed": False, "needs_ac": True, "needs_utilities_included": True,
            "bio": "Grad student at Illinois Tech. Early riser, keep common areas spotless, looking for a calm home near campus.",
        },
        {
            "seeker_id": ids["demo.seeker2@rentpilot.app"],
            "city": "Chicago", "state": "Illinois",
            "budget_min": 700, "budget_max": 1000, "move_in_date": "2026-07-15",
            "lease_duration": "flexible",
            "cleanliness": 3, "noise_level": 4, "guests_frequency": 4,
            "smoking": False, "schedule": "night_owl", "gender": "male",
            "needs_furnished": False, "needs_parking": True, "needs_laundry": True,
            "needs_pets_allowed": True, "needs_ac": True, "needs_utilities_included": False,
            "bio": "Software intern downtown. Night owl, social, have a small cat. Need parking for my car.",
        },
    ]
    for seeker in seekers:
        token = tokens["demo.seeker1@rentpilot.app"] if seeker["seeker_id"] == ids["demo.seeker1@rentpilot.app"] else tokens["demo.seeker2@rentpilot.app"]
        result = post("/match/seekers", seeker, token)
        print(f"  seeker budget ${seeker['budget_min']}-{seeker['budget_max']} -> {len(result['matches'])} match(es)")

    print("\nDone. Demo accounts (password: RentPilotDemo1!):")
    for user in DEMO_USERS:
        print(f"  {user['email']}")


if __name__ == "__main__":
    main()
