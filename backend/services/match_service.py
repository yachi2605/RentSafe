from datetime import date
from math import sqrt


def build_space_vector(space: dict) -> list[float]:
    """
    Convert a Space Post into a numeric vector representing
    what the poster offers and what they want in a roommate.
    """
    schedule_map = {"early_bird": 0.0, "flexible": 0.5, "night_owl": 1.0}
    return [
        # What the apartment offers (facilities)
        1.0 if space.get("is_furnished") else 0.0,
        1.0 if space.get("has_parking") else 0.0,
        1.0 if space.get("has_laundry") else 0.0,
        1.0 if space.get("pets_allowed") else 0.0,
        1.0 if space.get("has_ac") else 0.0,
        1.0 if space.get("utilities_included") else 0.0,
        # Poster's lifestyle preferences for roommate
        space.get("pref_cleanliness", 3) / 5.0,
        space.get("pref_noise_tolerance", 3) / 5.0,
        space.get("pref_guests_frequency", 3) / 5.0,
        1.0 if space.get("pref_smoking_ok") else 0.0,
        schedule_map.get(space.get("pref_schedule", "flexible"), 0.5),
        # Budget compatibility: poster's share normalized
        min(space.get("your_share", 0) / 5000.0, 1.0),
    ]


def build_seeker_vector(seeker: dict) -> list[float]:
    """
    Convert a Seeker Post into the same vector space as Space Posts.
    """
    schedule_map = {"early_bird": 0.0, "flexible": 0.5, "night_owl": 1.0}
    return [
        # What the seeker needs in an apartment
        1.0 if seeker.get("needs_furnished") else 0.0,
        1.0 if seeker.get("needs_parking") else 0.0,
        1.0 if seeker.get("needs_laundry") else 0.0,
        1.0 if seeker.get("needs_pets_allowed") else 0.0,
        1.0 if seeker.get("needs_ac") else 0.0,
        1.0 if seeker.get("needs_utilities_included") else 0.0,
        # Seeker's own lifestyle traits
        seeker.get("cleanliness", 3) / 5.0,
        seeker.get("noise_level", 3) / 5.0,
        seeker.get("guests_frequency", 3) / 5.0,
        1.0 if seeker.get("smoking") else 0.0,
        schedule_map.get(seeker.get("schedule", "flexible"), 0.5),
        # Budget: use midpoint of seeker's budget normalized
        min(((seeker.get("budget_min", 0) + seeker.get("budget_max", 0)) / 2) / 5000.0, 1.0),
    ]


def _cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    mag_a = sqrt(sum(value * value for value in vec_a))
    mag_b = sqrt(sum(value * value for value in vec_b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def compute_match_score(space: dict, seeker: dict) -> float:
    """Returns cosine similarity score between a space post and a seeker post."""
    vec_space = build_space_vector(space)
    vec_seeker = build_seeker_vector(seeker)
    score = _cosine_similarity(vec_space, vec_seeker)
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


def _parse_date(value) -> date | None:
    if not value:
        return None
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(str(value))
    except ValueError:
        return None


def _schedule_label(value: str) -> str:
    return str(value or "flexible").replace("_", " ")


def _duration_label(value: str) -> str:
    return str(value or "flexible").replace("_", " ")


def _add_factor(factors: list[dict], factor: str, aligned: bool, note: str, priority: int) -> None:
    factors.append(
        {
            "factor": factor,
            "aligned": aligned,
            "note": note,
            "_priority": priority,
        }
    )


def explain_match(space: dict, seeker: dict) -> list[dict]:
    """Human-readable factor-by-factor breakdown of why two posts match.

    Returns a list of {"factor", "aligned", "note"} dicts, strongest signals first.
    """
    factors = []

    share = space.get("your_share", 0)
    budget_min = seeker.get("budget_min", 0)
    budget_max = seeker.get("budget_max", 0)
    budget_fit = budget_min <= share <= budget_max
    if budget_fit:
        budget_note = f"${share}/mo fits the ${budget_min}-{budget_max} range"
    elif share < budget_min:
        budget_note = f"space is below the ${budget_min}/mo minimum target"
    else:
        budget_note = f"space is above the ${budget_max}/mo ceiling"
    _add_factor(factors, "Budget", budget_fit, budget_note, 100)

    space_move_in = _parse_date(space.get("move_in_date"))
    seeker_move_in = _parse_date(seeker.get("move_in_date"))
    if not space_move_in or not seeker_move_in:
        move_in_ok = True
        move_in_note = "one side is flexible on move-in timing"
    else:
        day_gap = abs((space_move_in - seeker_move_in).days)
        move_in_ok = day_gap <= 30
        move_in_note = (
            f"dates are {day_gap} day{'s' if day_gap != 1 else ''} apart"
            if day_gap
            else "same move-in date"
        )
    _add_factor(factors, "Move-in", move_in_ok, move_in_note, 95)

    space_duration = space.get("lease_duration", "flexible")
    seeker_duration = seeker.get("lease_duration", "flexible")
    duration_ok = "flexible" in (space_duration, seeker_duration) or space_duration == seeker_duration
    _add_factor(
        factors,
        "Lease term",
        duration_ok,
        f"{_duration_label(space_duration)} + {_duration_label(seeker_duration)}",
        90,
    )

    clean_gap = abs(space.get("pref_cleanliness", 3) - seeker.get("cleanliness", 3))
    _add_factor(
        factors,
        "Cleanliness",
        clean_gap <= 1,
        "similar standards" if clean_gap <= 1 else "different standards",
        88,
    )

    noise_gap = abs(space.get("pref_noise_tolerance", 3) - seeker.get("noise_level", 3))
    _add_factor(
        factors,
        "Noise",
        noise_gap <= 1,
        "compatible noise levels" if noise_gap <= 1 else "different noise levels",
        82,
    )

    guest_gap = abs(space.get("pref_guests_frequency", 3) - seeker.get("guests_frequency", 3))
    _add_factor(
        factors,
        "Guests",
        guest_gap <= 1,
        "similar guest habits" if guest_gap <= 1 else "different guest habits",
        78,
    )

    space_sched = space.get("pref_schedule", "flexible")
    seeker_sched = seeker.get("schedule", "flexible")
    sched_ok = "flexible" in (space_sched, seeker_sched) or space_sched == seeker_sched
    _add_factor(
        factors,
        "Schedule",
        sched_ok,
        f"{_schedule_label(space_sched)} + {_schedule_label(seeker_sched)}",
        74,
    )

    smoking_ok = space.get("pref_smoking_ok", False) or not seeker.get("smoking", False)
    _add_factor(
        factors,
        "Smoking",
        smoking_ok,
        "compatible" if smoking_ok else "smoker, non-smoking home",
        72,
    )

    gender_pref = space.get("pref_gender", "any")
    seeker_gender = seeker.get("gender")
    gender_ok = (
        gender_pref == "any"
        or not seeker_gender
        or seeker_gender == "prefer_not_to_say"
        or seeker_gender == gender_pref
    )
    _add_factor(
        factors,
        "Gender preference",
        gender_ok,
        "preference lines up" if gender_ok else "poster requested a different roommate gender",
        66,
    )

    needs = {
        "furnished": ("needs_furnished", "is_furnished"),
        "parking": ("needs_parking", "has_parking"),
        "laundry": ("needs_laundry", "has_laundry"),
        "pets": ("needs_pets_allowed", "pets_allowed"),
        "AC": ("needs_ac", "has_ac"),
        "utilities incl.": ("needs_utilities_included", "utilities_included"),
    }
    missing = [label for label, (need, has) in needs.items() if seeker.get(need) and not space.get(has)]
    wanted = [label for label, (need, _) in needs.items() if seeker.get(need)]
    if wanted:
        _add_factor(
            factors,
            "Apartment needs",
            not missing,
            "all requested amenities are covered" if not missing else f"missing: {', '.join(missing)}",
            96,
        )
    else:
        _add_factor(
            factors,
            "Apartment needs",
            True,
            "seeker did not list any required amenities",
            58,
        )

    ordered = sorted(factors, key=lambda factor: (not factor["aligned"], -factor["_priority"]))
    return [{k: v for k, v in factor.items() if k != "_priority"} for factor in ordered]


def summarize_match(space: dict, seeker: dict, breakdown: list[dict] | None = None) -> str:
    factors = breakdown or explain_match(space, seeker)
    strengths = [factor["factor"].lower() for factor in factors if factor.get("aligned")][:2]
    tradeoff = next((factor for factor in factors if not factor.get("aligned")), None)

    if strengths and tradeoff:
        return f"Strong on {', '.join(strengths)}. Worth discussing {tradeoff['factor'].lower()}."
    if strengths:
        return f"Strong fit on {', '.join(strengths)}."
    if tradeoff:
        return f"Promising match, but {tradeoff['factor'].lower()} needs discussion."
    return "Promising match across the main lifestyle and apartment signals."


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
