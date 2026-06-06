from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


def build_space_vector(space: dict) -> np.ndarray:
    """
    Convert a Space Post into a numeric vector representing
    what the poster offers and what they want in a roommate.
    """
    schedule_map = {"early_bird": 0.0, "flexible": 0.5, "night_owl": 1.0}
    return np.array([
        # What the apartment offers (facilities)
        1.0 if space.get("is_furnished") else 0.0,
        1.0 if space.get("has_parking") else 0.0,
        1.0 if space.get("has_laundry") else 0.0,
        1.0 if space.get("pets_allowed") else 0.0,
        1.0 if space.get("utilities_included") else 0.0,
        # Poster's lifestyle preferences for roommate
        space.get("pref_cleanliness", 3) / 5.0,
        space.get("pref_noise_tolerance", 3) / 5.0,
        space.get("pref_guests_frequency", 3) / 5.0,
        1.0 if space.get("pref_smoking_ok") else 0.0,
        schedule_map.get(space.get("pref_schedule", "flexible"), 0.5),
        # Budget compatibility: poster's share normalized
        min(space.get("your_share", 0) / 5000.0, 1.0),
    ])


def build_seeker_vector(seeker: dict) -> np.ndarray:
    """
    Convert a Seeker Post into the same vector space as Space Posts.
    """
    schedule_map = {"early_bird": 0.0, "flexible": 0.5, "night_owl": 1.0}
    return np.array([
        # What the seeker needs in an apartment
        1.0 if seeker.get("needs_furnished") else 0.0,
        1.0 if seeker.get("needs_parking") else 0.0,
        1.0 if seeker.get("needs_laundry") else 0.0,
        1.0 if seeker.get("needs_pets_allowed") else 0.0,
        1.0 if seeker.get("needs_utilities_included") else 0.0,
        # Seeker's own lifestyle traits
        seeker.get("cleanliness", 3) / 5.0,
        seeker.get("noise_level", 3) / 5.0,
        seeker.get("guests_frequency", 3) / 5.0,
        1.0 if seeker.get("smoking") else 0.0,
        schedule_map.get(seeker.get("schedule", "flexible"), 0.5),
        # Budget: use midpoint of seeker's budget normalized
        min(((seeker.get("budget_min", 0) + seeker.get("budget_max", 0)) / 2) / 5000.0, 1.0),
    ])


def compute_match_score(space: dict, seeker: dict) -> float:
    """Returns cosine similarity score between a space post and a seeker post."""
    vec_space = build_space_vector(space).reshape(1, -1)
    vec_seeker = build_seeker_vector(seeker).reshape(1, -1)
    score = cosine_similarity(vec_space, vec_seeker)[0][0]
    return round(float(score), 4)


def is_budget_compatible(space: dict, seeker: dict) -> bool:
    """Hard filter: seeker's budget range must overlap with the space's share cost."""
    share = space.get("your_share", 0)
    return seeker.get("budget_min", 0) <= share <= seeker.get("budget_max", float("inf"))


def is_city_match(space: dict, seeker: dict) -> bool:
    """Hard filter: must be in the same city and state."""
    return (
        space.get("city", "").lower() == seeker.get("city", "").lower()
        and space.get("state", "").lower() == seeker.get("state", "").lower()
    )


MATCH_THRESHOLD = 0.75


def find_matches_for_seeker(seeker: dict, all_spaces: list[dict]) -> list[dict]:
    results = []
    for space in all_spaces:
        if not space.get("is_active"):
            continue
        if not is_city_match(space, seeker):
            continue
        if not is_budget_compatible(space, seeker):
            continue
        score = compute_match_score(space, seeker)
        if score >= MATCH_THRESHOLD:
            results.append({"space_post_id": space["id"], "score": score})
    return sorted(results, key=lambda x: x["score"], reverse=True)


def find_matches_for_space(space: dict, all_seekers: list[dict]) -> list[dict]:
    results = []
    for seeker in all_seekers:
        if not seeker.get("is_active"):
            continue
        if not is_city_match(space, seeker):
            continue
        if not is_budget_compatible(space, seeker):
            continue
        score = compute_match_score(space, seeker)
        if score >= MATCH_THRESHOLD:
            results.append({"seeker_post_id": seeker["id"], "score": score})
    return sorted(results, key=lambda x: x["score"], reverse=True)
