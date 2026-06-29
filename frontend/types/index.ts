export interface Profile {
  id: string;
  full_name: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  school?: string;
  campus?: string;
  preferred_city?: string;
  preferred_state?: string;
  budget_goal_min?: number;
  budget_goal_max?: number;
  preferred_move_in_date?: string;
  prefers_furnished?: boolean;
  prefers_parking?: boolean;
  prefers_laundry?: boolean;
  prefers_pets?: boolean;
  prefers_ac?: boolean;
  is_student_verified?: boolean;
}

export interface MatchBrowseFilters {
  city?: string;
  state?: string;
  budget?: number;
  move_in_by?: string;
  furnished?: boolean;
  parking?: boolean;
  laundry?: boolean;
  pets?: boolean;
  ac?: boolean;
}

export type LeaseType = 'existing' | 'new_cosign' | 'sublet';
export type LeaseDuration = 'short_term' | 'long_term' | 'flexible';
export type Schedule = 'early_bird' | 'night_owl' | 'flexible';
export type GenderPref = 'any' | 'male' | 'female' | 'non_binary';
export type ApartmentType = 'studio' | '1bhk' | '2bhk' | '3bhk' | 'room_only';
export type ReportTargetType = 'space_post' | 'seeker_post' | 'match';

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

export interface MatchFactor {
  factor: string;
  aligned: boolean;
  note: string;
}

export interface Match {
  id: string;
  space_post: SpacePost;
  seeker_post: SeekerPost;
  score: number;
  space_poster_seen: boolean;
  seeker_seen: boolean;
  created_at: string;
  breakdown?: MatchFactor[];
  summary?: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  moderation_notice?: string;
}

export interface LeaseRedFlag {
  clause: string;
  text: string;
  risk_level: 'high' | 'medium' | 'low';
  explanation: string;
}

export interface LeaseAnalysisResult {
  summary: string;
  red_flags: LeaseRedFlag[];
  negotiation_tips: string[];
  tenant_friendly_score: number;
  extracted_text?: string;
}

export interface ProactiveQAItem {
  question: string;
  answer: string;
  clause_ref?: string;
}

export interface MoveOutItem {
  task: string;
  reason: string;
  timing: string;
}

export interface ScamCheckResult {
  scam_score: number;
  verdict: 'likely_scam' | 'suspicious' | 'possibly_legit' | 'likely_legit';
  red_flags: { flag: string; explanation: string }[];
  hidden_fees: { fee_type: string; estimated_amount: string }[];
  tips: string[];
}

export interface SavedLeaseAnalysis {
  id: string;
  file_name: string;
  file_url: string;
  created_at: string;
  result: LeaseAnalysisResult;
}

export interface SavedScamCheck {
  id: string;
  listing_input: string;
  created_at: string;
  result: ScamCheckResult;
}

export interface RightsSourceReference {
  title: string;
  url: string;
  organization: string;
  topic: string;
}

export interface RightsAnswer {
  answer: string;
  state: string;
  supported_state: boolean;
  refused: boolean;
  coverage_message: string;
  disclaimer: string;
  sources: RightsSourceReference[];
}

export interface RightsCoverage {
  states: string[];
  supported_states: string[];
  coverage_topics: string[];
  coverage_message: string;
}
