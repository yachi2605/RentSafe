-- Profiles (extends Supabase Auth users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  tos_accepted BOOLEAN DEFAULT FALSE,        -- Has user accepted Terms of Service?
  tos_accepted_at TIMESTAMPTZ,               -- Timestamp of acceptance (legal record)
  tos_version TEXT DEFAULT '1.0',            -- Which version they accepted
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Space Posts: "I have a space"
CREATE TABLE space_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poster_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Apartment details
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT,
  apartment_type TEXT NOT NULL,         -- 'studio' | '1bhk' | '2bhk' | '3bhk' | 'room_only'
  total_rent NUMERIC NOT NULL,          -- full apartment rent
  your_share NUMERIC NOT NULL,          -- what the poster pays
  rooms_available INT DEFAULT 1,        -- how many people they need
  lease_type TEXT NOT NULL,             -- 'existing' | 'new_cosign' | 'sublet'
  lease_duration TEXT NOT NULL,         -- 'short_term' | 'long_term' | 'flexible'
  move_in_date DATE,

  -- Apartment facilities (for seeker matching)
  is_furnished BOOLEAN DEFAULT FALSE,
  has_parking BOOLEAN DEFAULT FALSE,
  has_laundry BOOLEAN DEFAULT FALSE,
  pets_allowed BOOLEAN DEFAULT FALSE,
  has_ac BOOLEAN DEFAULT FALSE,
  has_gym BOOLEAN DEFAULT FALSE,
  utilities_included BOOLEAN DEFAULT FALSE,

  -- Poster's lifestyle preferences (what they want in a roommate)
  pref_cleanliness INT CHECK (pref_cleanliness BETWEEN 1 AND 5),
  pref_noise_tolerance INT CHECK (pref_noise_tolerance BETWEEN 1 AND 5),
  pref_guests_frequency INT CHECK (pref_guests_frequency BETWEEN 1 AND 5),
  pref_smoking_ok BOOLEAN DEFAULT FALSE,
  pref_schedule TEXT DEFAULT 'flexible', -- 'early_bird' | 'night_owl' | 'flexible'
  pref_gender TEXT DEFAULT 'any',        -- 'any' | 'male' | 'female' | 'non_binary'

  description TEXT,
  images TEXT[],                         -- Supabase storage URLs
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seeker Posts: "I need a space"
CREATE TABLE seeker_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seeker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Where they want to live
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  preferred_neighborhoods TEXT[],

  -- Budget & timeline
  budget_min NUMERIC NOT NULL,
  budget_max NUMERIC NOT NULL,
  move_in_date DATE,
  lease_duration TEXT NOT NULL,         -- 'short_term' | 'long_term' | 'flexible'

  -- Seeker's own lifestyle (for matching with poster preferences)
  cleanliness INT CHECK (cleanliness BETWEEN 1 AND 5),
  noise_level INT CHECK (noise_level BETWEEN 1 AND 5),
  guests_frequency INT CHECK (guests_frequency BETWEEN 1 AND 5),
  smoking BOOLEAN DEFAULT FALSE,
  schedule TEXT DEFAULT 'flexible',
  gender TEXT,                           -- 'male' | 'female' | 'non_binary' | 'prefer_not_to_say'

  -- Must-haves in the apartment
  needs_furnished BOOLEAN DEFAULT FALSE,
  needs_parking BOOLEAN DEFAULT FALSE,
  needs_laundry BOOLEAN DEFAULT FALSE,
  needs_pets_allowed BOOLEAN DEFAULT FALSE,
  needs_ac BOOLEAN DEFAULT FALSE,
  needs_utilities_included BOOLEAN DEFAULT FALSE,

  bio TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Match results
CREATE TABLE matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  space_post_id UUID REFERENCES space_posts(id) ON DELETE CASCADE,
  seeker_post_id UUID REFERENCES seeker_posts(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL,               -- 0.0 to 1.0 cosine similarity
  space_poster_seen BOOLEAN DEFAULT FALSE,
  seeker_seen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(space_post_id, seeker_post_id)
);

-- In-app messages between matched users
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lease Analysis History
CREATE TABLE lease_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  file_name TEXT,
  file_url TEXT,
  red_flags JSONB,
  summary TEXT,
  negotiation_tips JSONB,
  tenant_friendly_score INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scam Check History
CREATE TABLE scam_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  listing_input TEXT,
  scam_score NUMERIC,
  red_flags JSONB,
  hidden_fees JSONB,
  verdict TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
