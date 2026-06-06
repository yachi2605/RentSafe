export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
}

export type LeaseType = 'existing' | 'new_cosign' | 'sublet';
export type LeaseDuration = 'short_term' | 'long_term' | 'flexible';
export type Schedule = 'early_bird' | 'night_owl' | 'flexible';
export type GenderPref = 'any' | 'male' | 'female' | 'non_binary';
export type ApartmentType = 'studio' | '1bhk' | '2bhk' | '3bhk' | 'room_only';

export interface SpacePost {
  id: string;
  poster_id: string;
  poster?: Profile;
  city: string;
  state: string;
  zip?: string;
  apartment_type: ApartmentType;
  total_rent: number;
  your_share: number;
  rooms_available: number;
  lease_type: LeaseType;
  lease_duration: LeaseDuration;
  move_in_date?: string;
  is_furnished: boolean;
  has_parking: boolean;
  has_laundry: boolean;
  pets_allowed: boolean;
  has_ac: boolean;
  has_gym: boolean;
  utilities_included: boolean;
  pref_cleanliness: number;
  pref_noise_tolerance: number;
  pref_guests_frequency: number;
  pref_smoking_ok: boolean;
  pref_schedule: Schedule;
  pref_gender: GenderPref;
  description?: string;
  images?: string[];
  is_active: boolean;
  created_at: string;
}

export interface SeekerPost {
  id: string;
  seeker_id: string;
  seeker?: Profile;
  city: string;
  state: string;
  budget_min: number;
  budget_max: number;
  move_in_date?: string;
  lease_duration: LeaseDuration;
  cleanliness: number;
  noise_level: number;
  guests_frequency: number;
  smoking: boolean;
  schedule: Schedule;
  gender?: string;
  needs_furnished: boolean;
  needs_parking: boolean;
  needs_laundry: boolean;
  needs_pets_allowed: boolean;
  needs_ac: boolean;
  needs_utilities_included: boolean;
  bio?: string;
  is_active: boolean;
  created_at: string;
}

export interface Match {
  id: string;
  space_post: SpacePost;
  seeker_post: SeekerPost;
  score: number;
  space_poster_seen: boolean;
  seeker_seen: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface LeaseAnalysisResult {
  summary: string;
  red_flags: {
    clause: string;
    text: string;
    risk_level: 'high' | 'medium' | 'low';
    explanation: string;
  }[];
  negotiation_tips: string[];
  tenant_friendly_score: number;
}

export interface ScamCheckResult {
  scam_score: number;
  verdict: 'likely_scam' | 'suspicious' | 'possibly_legit' | 'likely_legit';
  red_flags: { flag: string; explanation: string }[];
  hidden_fees: { fee_type: string; estimated_amount: string }[];
  tips: string[];
}
