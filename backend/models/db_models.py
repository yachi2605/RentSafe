from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True)
    full_name = Column(Text)
    email = Column(Text, unique=True)
    avatar_url = Column(Text)
    bio = Column(Text)
    tos_accepted = Column(Boolean, default=False)
    tos_accepted_at = Column(DateTime(timezone=True))
    tos_version = Column(Text, default="1.0")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SpacePost(Base):
    __tablename__ = "space_posts"

    id = Column(UUID(as_uuid=True), primary_key=True)
    poster_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"))
    city = Column(Text, nullable=False)
    state = Column(Text, nullable=False)
    zip = Column(Text)
    apartment_type = Column(Text, nullable=False)
    total_rent = Column(Numeric, nullable=False)
    your_share = Column(Numeric, nullable=False)
    rooms_available = Column(Integer, default=1)
    lease_type = Column(Text, nullable=False)
    lease_duration = Column(Text, nullable=False)
    move_in_date = Column(Date)
    is_furnished = Column(Boolean, default=False)
    has_parking = Column(Boolean, default=False)
    has_laundry = Column(Boolean, default=False)
    pets_allowed = Column(Boolean, default=False)
    has_ac = Column(Boolean, default=False)
    has_gym = Column(Boolean, default=False)
    utilities_included = Column(Boolean, default=False)
    pref_cleanliness = Column(Integer)
    pref_noise_tolerance = Column(Integer)
    pref_guests_frequency = Column(Integer)
    pref_smoking_ok = Column(Boolean, default=False)
    pref_schedule = Column(Text, default="flexible")
    pref_gender = Column(Text, default="any")
    description = Column(Text)
    images = Column(ARRAY(Text))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    poster = relationship("Profile")


class SeekerPost(Base):
    __tablename__ = "seeker_posts"

    id = Column(UUID(as_uuid=True), primary_key=True)
    seeker_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"))
    city = Column(Text, nullable=False)
    state = Column(Text, nullable=False)
    preferred_neighborhoods = Column(ARRAY(Text))
    budget_min = Column(Numeric, nullable=False)
    budget_max = Column(Numeric, nullable=False)
    move_in_date = Column(Date)
    lease_duration = Column(Text, nullable=False)
    cleanliness = Column(Integer)
    noise_level = Column(Integer)
    guests_frequency = Column(Integer)
    smoking = Column(Boolean, default=False)
    schedule = Column(Text, default="flexible")
    gender = Column(Text)
    needs_furnished = Column(Boolean, default=False)
    needs_parking = Column(Boolean, default=False)
    needs_laundry = Column(Boolean, default=False)
    needs_pets_allowed = Column(Boolean, default=False)
    needs_ac = Column(Boolean, default=False)
    needs_utilities_included = Column(Boolean, default=False)
    bio = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    seeker = relationship("Profile")


class Match(Base):
    __tablename__ = "matches"

    id = Column(UUID(as_uuid=True), primary_key=True)
    space_post_id = Column(UUID(as_uuid=True), ForeignKey("space_posts.id", ondelete="CASCADE"))
    seeker_post_id = Column(UUID(as_uuid=True), ForeignKey("seeker_posts.id", ondelete="CASCADE"))
    score = Column(Numeric, nullable=False)
    space_poster_seen = Column(Boolean, default=False)
    seeker_seen = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True)
    match_id = Column(UUID(as_uuid=True), ForeignKey("matches.id", ondelete="CASCADE"))
    sender_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"))
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LeaseAnalysis(Base):
    __tablename__ = "lease_analyses"

    id = Column(UUID(as_uuid=True), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"))
    file_name = Column(Text)
    file_url = Column(Text)
    red_flags = Column(JSONB)
    summary = Column(Text)
    negotiation_tips = Column(JSONB)
    tenant_friendly_score = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ScamCheck(Base):
    __tablename__ = "scam_checks"

    id = Column(UUID(as_uuid=True), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"))
    listing_input = Column(Text)
    scam_score = Column(Numeric)
    red_flags = Column(JSONB)
    hidden_fees = Column(JSONB)
    verdict = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
