import { MatchBrowseFilters, Profile } from '@/types';

export function formatCampusLabel(profile?: Partial<Profile> | null) {
  if (!profile) return '';
  const parts = [profile.school, profile.campus].filter(Boolean);
  return parts.join(' · ');
}

export function profileHasBrowsePreferences(profile?: Partial<Profile> | null) {
  if (!profile) return false;

  return Boolean(
    profile.preferred_city ||
      profile.preferred_state ||
      profile.budget_goal_min ||
      profile.budget_goal_max ||
      profile.preferred_move_in_date ||
      profile.prefers_furnished ||
      profile.prefers_parking ||
      profile.prefers_laundry ||
      profile.prefers_pets ||
      profile.prefers_ac,
  );
}

export function countProfilePreferenceSignals(profile?: Partial<Profile> | null) {
  if (!profile) return 0;

  const boolCount = [
    profile.prefers_furnished,
    profile.prefers_parking,
    profile.prefers_laundry,
    profile.prefers_pets,
    profile.prefers_ac,
  ].filter(Boolean).length;

  const fieldCount = [
    profile.preferred_city,
    profile.preferred_state,
    profile.budget_goal_min,
    profile.budget_goal_max,
    profile.preferred_move_in_date,
  ].filter(Boolean).length;

  return boolCount + fieldCount;
}

export function profileToBrowseFilters(profile?: Partial<Profile> | null): MatchBrowseFilters {
  if (!profile) return {};

  return {
    city: profile.preferred_city || undefined,
    state: profile.preferred_state || undefined,
    budget:
      profile.budget_goal_max ??
      profile.budget_goal_min ??
      undefined,
    move_in_by: profile.preferred_move_in_date || undefined,
    furnished: profile.prefers_furnished || undefined,
    parking: profile.prefers_parking || undefined,
    laundry: profile.prefers_laundry || undefined,
    pets: profile.prefers_pets || undefined,
    ac: profile.prefers_ac || undefined,
  };
}
