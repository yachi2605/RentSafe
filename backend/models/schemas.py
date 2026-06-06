from datetime import date
from typing import Optional, List
from pydantic import BaseModel, Field


class LeaseAnalysisResponse(BaseModel):
    summary: str
    red_flags: list[dict]
    negotiation_tips: list[str]
    tenant_friendly_score: int


class ScamCheckRequest(BaseModel):
    listing_text: str
    user_id: Optional[str] = None


class ScamCheckResponse(BaseModel):
    scam_score: int
    verdict: str
    red_flags: list[dict]
    hidden_fees: list[dict]
    tips: list[str]


class RightsQuestionRequest(BaseModel):
    question: str
    state: str


class RightsAnswerResponse(BaseModel):
    answer: str
    sources: list[str] = Field(default_factory=list)


class SpacePostCreate(BaseModel):
    poster_id: str
    city: str
    state: str
    zip: Optional[str] = None
    apartment_type: str
    total_rent: float
    your_share: float
    rooms_available: int = 1
    lease_type: str
    lease_duration: str
    move_in_date: Optional[date] = None
    is_furnished: bool = False
    has_parking: bool = False
    has_laundry: bool = False
    pets_allowed: bool = False
    has_ac: bool = False
    has_gym: bool = False
    utilities_included: bool = False
    pref_cleanliness: int = 3
    pref_noise_tolerance: int = 3
    pref_guests_frequency: int = 3
    pref_smoking_ok: bool = False
    pref_schedule: str = "flexible"
    pref_gender: str = "any"
    description: Optional[str] = None


class SeekerPostCreate(BaseModel):
    seeker_id: str
    city: str
    state: str
    budget_min: float
    budget_max: float
    move_in_date: Optional[date] = None
    lease_duration: str
    cleanliness: int = 3
    noise_level: int = 3
    guests_frequency: int = 3
    smoking: bool = False
    schedule: str = "flexible"
    gender: Optional[str] = None
    needs_furnished: bool = False
    needs_parking: bool = False
    needs_laundry: bool = False
    needs_pets_allowed: bool = False
    needs_ac: bool = False
    needs_utilities_included: bool = False
    bio: Optional[str] = None


class MatchRecord(BaseModel):
    id: str
    space_post_id: str
    seeker_post_id: str
    score: float
    space_poster_seen: bool
    seeker_seen: bool
    created_at: str


class MessageCreate(BaseModel):
    match_id: str
    sender_id: str
    content: str


class MessageResponse(BaseModel):
    id: str
    match_id: str
    sender_id: str
    content: str
    created_at: str
