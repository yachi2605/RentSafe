'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Profile } from '@/types';
import { trackEvent } from '@/lib/analytics';
import { countProfilePreferenceSignals, formatCampusLabel } from '@/lib/campus-profile';
import { US_STATES } from '@/lib/rental-options';

const AMENITY_PREFERENCES = [
  { key: 'prefers_furnished', label: 'Furnished' },
  { key: 'prefers_parking', label: 'Parking' },
  { key: 'prefers_laundry', label: 'Laundry' },
  { key: 'prefers_pets', label: 'Pet-friendly' },
  { key: 'prefers_ac', label: 'AC' },
] as const;

type AmenityKey = (typeof AMENITY_PREFERENCES)[number]['key'];

interface ProfileFormState {
  full_name: string;
  school: string;
  campus: string;
  bio: string;
  preferred_city: string;
  preferred_state: string;
  budget_goal_min: string;
  budget_goal_max: string;
  preferred_move_in_date: string;
  prefers_furnished: boolean;
  prefers_parking: boolean;
  prefers_laundry: boolean;
  prefers_pets: boolean;
  prefers_ac: boolean;
}

const EMPTY_FORM: ProfileFormState = {
  full_name: '',
  school: '',
  campus: '',
  bio: '',
  preferred_city: '',
  preferred_state: '',
  budget_goal_min: '',
  budget_goal_max: '',
  preferred_move_in_date: '',
  prefers_furnished: false,
  prefers_parking: false,
  prefers_laundry: false,
  prefers_pets: false,
  prefers_ac: false,
};

function toFormState(profile: Partial<Profile> | null | undefined): ProfileFormState {
  if (!profile) return EMPTY_FORM;

  return {
    full_name: profile.full_name || '',
    school: profile.school || '',
    campus: profile.campus || '',
    bio: profile.bio || '',
    preferred_city: profile.preferred_city || '',
    preferred_state: profile.preferred_state || '',
    budget_goal_min: profile.budget_goal_min ? String(profile.budget_goal_min) : '',
    budget_goal_max: profile.budget_goal_max ? String(profile.budget_goal_max) : '',
    preferred_move_in_date: profile.preferred_move_in_date || '',
    prefers_furnished: Boolean(profile.prefers_furnished),
    prefers_parking: Boolean(profile.prefers_parking),
    prefers_laundry: Boolean(profile.prefers_laundry),
    prefers_pets: Boolean(profile.prefers_pets),
    prefers_ac: Boolean(profile.prefers_ac),
  };
}

function selectClasses() {
  return 'h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:border-brand-green focus:outline-none';
}

export default function MatchProfilePage() {
  const [supabase] = useState(() => createClientComponentClient());
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<ProfileFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (active) {
            setError('Your session expired. Please sign in again.');
          }
          return;
        }

        const fullName = (user.user_metadata?.full_name as string) || '';
        const fallbackProfile: Profile = {
          id: user.id,
          email: user.email ?? '',
          full_name: fullName,
        };

        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          throw new Error(profileError.message);
        }

        const nextProfile = (data as Profile | null) || fallbackProfile;

        if (!active) return;
        setUserId(user.id);
        setUserEmail(user.email ?? '');
        setProfile(nextProfile);
        setForm(toFormState(nextProfile));
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load your campus profile');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [supabase]);

  const campusLabel = useMemo(
    () => formatCampusLabel({ school: form.school, campus: form.campus }),
    [form.school, form.campus],
  );
  const preferenceCount = useMemo(
    () =>
      countProfilePreferenceSignals({
        preferred_city: form.preferred_city,
        preferred_state: form.preferred_state,
        budget_goal_min: form.budget_goal_min ? Number(form.budget_goal_min) : undefined,
        budget_goal_max: form.budget_goal_max ? Number(form.budget_goal_max) : undefined,
        preferred_move_in_date: form.preferred_move_in_date,
        prefers_furnished: form.prefers_furnished,
        prefers_parking: form.prefers_parking,
        prefers_laundry: form.prefers_laundry,
        prefers_pets: form.prefers_pets,
        prefers_ac: form.prefers_ac,
      }),
    [form],
  );

  const updateField = <K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleAmenity = (key: AmenityKey) => {
    setForm((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleSave = async () => {
    if (!userId) return;

    const budgetMin = form.budget_goal_min ? Number(form.budget_goal_min) : null;
    const budgetMax = form.budget_goal_max ? Number(form.budget_goal_max) : null;

    if (budgetMin !== null && budgetMin <= 0) {
      setError('Budget minimum must be greater than 0.');
      return;
    }
    if (budgetMax !== null && budgetMax <= 0) {
      setError('Budget maximum must be greater than 0.');
      return;
    }
    if (budgetMin !== null && budgetMax !== null && budgetMax < budgetMin) {
      setError('Budget maximum cannot be lower than budget minimum.');
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    const payload = {
      id: userId,
      email: userEmail || null,
      full_name: form.full_name.trim(),
      school: form.school.trim() || null,
      campus: form.campus.trim() || null,
      bio: form.bio.trim() || null,
      preferred_city: form.preferred_city.trim() || null,
      preferred_state: form.preferred_state || null,
      budget_goal_min: budgetMin,
      budget_goal_max: budgetMax,
      preferred_move_in_date: form.preferred_move_in_date || null,
      prefers_furnished: form.prefers_furnished,
      prefers_parking: form.prefers_parking,
      prefers_laundry: form.prefers_laundry,
      prefers_pets: form.prefers_pets,
      prefers_ac: form.prefers_ac,
    };

    const { error: saveError } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });

    if (saveError) {
      trackEvent('match_profile_save_failed');
      setError(saveError.message);
      setSaving(false);
      return;
    }

    const nextProfile = { ...(profile || { id: userId }), ...payload } as Profile;
    setProfile(nextProfile);
    setNotice('Campus profile saved. You can now reuse these preferences from the match feed.');
    trackEvent('match_profile_saved', {
      school: Boolean(payload.school),
      campus: Boolean(payload.campus),
      preference_count: preferenceCount,
    });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-sky-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 sm:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300/80">
              Renter profile
            </p>
            <h1 className="font-sora text-3xl font-bold sm:text-4xl">Your renter profile</h1>
            <p className="text-sm leading-relaxed text-white/65">
              Save school, campus, and housing preferences once, then reuse them when you browse
              the matching feed. Public listing cards will only expose your school and campus if
              you choose to fill them in here.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/match">
              <Button className="w-full sm:w-auto">Open match feed</Button>
            </Link>
            <Link href="/match/my-matches">
              <Button variant="secondary" className="w-full sm:w-auto">My matches</Button>
            </Link>
          </div>
        </div>
      </section>

      {loading && <p className="text-sm text-white/50">Loading your campus profile...</p>}

      {error && (
        <Card className="border-amber-400/20 bg-amber-400/5 text-amber-100">
          <p className="font-medium">Couldn&apos;t save or load your profile.</p>
          <p className="mt-1 text-sm text-amber-100/70">{error}</p>
        </Card>
      )}

      {notice && (
        <Card className="border-brand-green/20 bg-brand-green/5 text-brand-green">
          <p className="text-sm">{notice}</p>
        </Card>
      )}

      {!loading && (
        <>
          <Card className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
                  Profile snapshot
                </p>
                <h2 className="text-xl font-semibold">{form.full_name || 'Your name'}</h2>
                <p className="text-sm text-white/55">{userEmail || profile?.email || 'Signed-in renter'}</p>
                {campusLabel ? <p className="text-sm text-white/65">{campusLabel}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="green">{preferenceCount} saved preference signal{preferenceCount === 1 ? '' : 's'}</Badge>
                <Badge tone="neutral">{profile?.is_student_verified ? 'Verified student' : 'Campus profile'}</Badge>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold">Campus identity</h2>
                <p className="mt-1 text-sm text-white/55">
                  These fields help other renters understand your school context when they browse listings.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                    Full name
                  </label>
                  <Input
                    value={form.full_name}
                    onChange={(event) => updateField('full_name', event.target.value)}
                    placeholder="Priya Sharma"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                    School
                  </label>
                  <Input
                    value={form.school}
                    onChange={(event) => updateField('school', event.target.value)}
                    placeholder="Illinois Institute of Technology"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                    Campus or area
                  </label>
                  <Input
                    value={form.campus}
                    onChange={(event) => updateField('campus', event.target.value)}
                    placeholder="Mies Campus"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                    Public intro
                  </label>
                  <Textarea
                    className="min-h-[128px]"
                    value={form.bio}
                    onChange={(event) => updateField('bio', event.target.value)}
                    placeholder="Share your routine, roommate style, and what kind of home works best for you."
                  />
                </div>
              </div>
            </Card>

            <Card className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold">How this helps matching</h2>
                <p className="mt-1 text-sm text-white/55">
                  Save defaults here, then apply them from the match feed instead of re-entering filters every time.
                </p>
              </div>

              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                  Stored for browse defaults
                </p>
                <ul className="space-y-2 text-sm text-white/65">
                  <li>Preferred city, state, move-in target, and budget target</li>
                  <li>Apartment must-haves like furnished, parking, laundry, pets, and AC</li>
                  <li>School and campus labels on your public listing cards</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
                <p className="text-sm text-sky-100/85">
                  Keep this profile lightweight. Your actual space or seeker post still carries the detailed listing
                  terms, while this page stores the defaults you want to reuse.
                </p>
              </div>
            </Card>
          </div>

          <Card className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold">Housing preferences</h2>
              <p className="mt-1 text-sm text-white/55">
                These settings map directly to the filters on the match feed.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Preferred city
                </label>
                <Input
                  value={form.preferred_city}
                  onChange={(event) => updateField('preferred_city', event.target.value)}
                  placeholder="Chicago"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Preferred state
                </label>
                <select
                  value={form.preferred_state}
                  onChange={(event) => updateField('preferred_state', event.target.value)}
                  className={selectClasses()}
                >
                  <option value="">Any state</option>
                  {US_STATES.map((state) => (
                    <option key={state} value={state} className="bg-brand-navy text-white">
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Budget minimum
                </label>
                <Input
                  type="number"
                  min="0"
                  step="50"
                  value={form.budget_goal_min}
                  onChange={(event) => updateField('budget_goal_min', event.target.value)}
                  placeholder="900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Budget maximum
                </label>
                <Input
                  type="number"
                  min="0"
                  step="50"
                  value={form.budget_goal_max}
                  onChange={(event) => updateField('budget_goal_max', event.target.value)}
                  placeholder="1300"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,280px)_1fr]">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Preferred move-in date
                </label>
                <Input
                  type="date"
                  value={form.preferred_move_in_date}
                  onChange={(event) => updateField('preferred_move_in_date', event.target.value)}
                />
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Apartment must-haves
                </p>
                <div className="flex flex-wrap gap-3">
                  {AMENITY_PREFERENCES.map((item) => {
                    const active = form[item.key];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => toggleAmenity(item.key)}
                        className={`rounded-full border px-4 py-2 text-sm transition ${
                          active
                            ? 'border-brand-green/50 bg-brand-green/15 text-brand-green'
                            : 'border-white/15 bg-white/[0.03] text-white/70 hover:border-white/25 hover:bg-white/[0.06]'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <p className="text-sm text-white/50">
                Save once here, then reuse these defaults from the match feed when you browse spaces and seekers.
              </p>
              <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                {saving ? 'Saving profile...' : 'Save campus profile'}
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
