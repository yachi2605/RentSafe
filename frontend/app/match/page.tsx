'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { listSpacePosts, listSeekerPosts } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import { MatchBrowseFilters, Profile, SeekerPost, SpacePost } from '@/types';
import SpacePostCard from '@/components/SpacePostCard';
import SeekerPostCard from '@/components/SeekerPostCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Home, GraduationCap } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton';
import {
  countProfilePreferenceSignals,
  formatCampusLabel,
  profileHasBrowsePreferences,
} from '@/lib/campus-profile';
import { US_STATES } from '@/lib/rental-options';

const AMENITY_FILTERS = [
  { key: 'furnished', label: 'Furnished', icon: '🛏️' },
  { key: 'parking', label: 'Parking', icon: '🚗' },
  { key: 'laundry', label: 'Laundry', icon: '🧺' },
  { key: 'pets', label: 'Pets', icon: '🐾' },
  { key: 'ac', label: 'AC', icon: '❄️' },
] as const;

type AmenityKey = (typeof AMENITY_FILTERS)[number]['key'];

interface MatchFilterFormState {
  city: string;
  state: string;
  budget: string;
  move_in_by: string;
  furnished: boolean;
  parking: boolean;
  laundry: boolean;
  pets: boolean;
  ac: boolean;
}

const INITIAL_FILTERS: MatchFilterFormState = {
  city: '',
  state: '',
  budget: '',
  move_in_by: '',
  furnished: false,
  parking: false,
  laundry: false,
  pets: false,
  ac: false,
};

const MATCH_GUIDE = [
  {
    title: 'Use shared filters once',
    text: 'The same budget and amenity controls shape both supply and demand, so the market picture stays consistent.',
  },
  {
    title: 'Post when the feed is thin',
    text: 'If the feed feels sparse, the fastest way forward is posting your space or your search and letting matches accumulate.',
  },
  {
    title: 'Keep first contact on-platform',
    text: 'Use match chat first, then verify the lease, rent split, and move-in details before money changes hands.',
  },
];

function selectClasses() {
  return 'h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:border-brand-green focus:outline-none';
}

function activeFilterCount(filters: MatchFilterFormState) {
  return Object.entries(filters).filter(([_, value]) => {
    if (typeof value === 'boolean') return value;
    return value.trim().length > 0;
  }).length;
}

function normalizeFilters(filters: MatchFilterFormState): MatchBrowseFilters {
  const parsedBudget = Number(filters.budget);
  return {
    city: filters.city.trim() || undefined,
    state: filters.state || undefined,
    budget: Number.isFinite(parsedBudget) && parsedBudget > 0 ? parsedBudget : undefined,
    move_in_by: filters.move_in_by || undefined,
    furnished: filters.furnished || undefined,
    parking: filters.parking || undefined,
    laundry: filters.laundry || undefined,
    pets: filters.pets || undefined,
    ac: filters.ac || undefined,
  };
}

export default function MatchPage() {
  const [supabase] = useState(() => createClientComponentClient());
  const [spaces, setSpaces] = useState<SpacePost[]>([]);
  const [seekers, setSeekers] = useState<SeekerPost[]>([]);
  const [savedProfile, setSavedProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [filters, setFilters] = useState<MatchFilterFormState>(INITIAL_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const deferredFilters = useDeferredValue(filters);
  const deferredFilterKey = JSON.stringify(deferredFilters);
  const appliedFilterCount = activeFilterCount(filters);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          if (active) setProfileLoading(false);
          return;
        }

        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (!active) return;
        setSavedProfile((data as Profile | null) || null);
      } finally {
        if (active) {
          setProfileLoading(false);
        }
      }
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, [supabase]);

  useEffect(() => {
    let active = true;
    const normalizedFilters = normalizeFilters(deferredFilters);

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [spaceRes, seekerRes] = await Promise.all([
          listSpacePosts(normalizedFilters),
          listSeekerPosts(normalizedFilters),
        ]);
        if (!active) return;
        setSpaces(spaceRes.spaces || []);
        setSeekers(seekerRes.seekers || []);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load posts');
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
  }, [deferredFilterKey, deferredFilters]);

  const updateFilter = <K extends keyof MatchFilterFormState>(key: K, value: MatchFilterFormState[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const toggleAmenity = (key: AmenityKey) => {
    setFilters((current) => ({ ...current, [key]: !current[key] }));
  };

  const applySavedPreferences = () => {
    if (!savedProfile) return;

    const budgetValue = savedProfile.budget_goal_max ?? savedProfile.budget_goal_min;

    setFilters({
      city: savedProfile.preferred_city || '',
      state: savedProfile.preferred_state || '',
      budget: budgetValue ? String(budgetValue) : '',
      move_in_by: savedProfile.preferred_move_in_date || '',
      furnished: Boolean(savedProfile.prefers_furnished),
      parking: Boolean(savedProfile.prefers_parking),
      laundry: Boolean(savedProfile.prefers_laundry),
      pets: Boolean(savedProfile.prefers_pets),
      ac: Boolean(savedProfile.prefers_ac),
    });
    trackEvent('match_saved_preferences_applied', { saved_signal_count: savedPreferenceCount });
  };

  const savedCampusLabel = formatCampusLabel(savedProfile);
  const hasSavedPreferences = profileHasBrowsePreferences(savedProfile);
  const savedPreferenceCount = countProfilePreferenceSignals(savedProfile);

  return (
    <div className="space-y-8">
      <section className="rounded-[30px] border border-brand-green/20 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-green/70">
              Roommate matching
            </p>
            <h1 className="font-sora text-3xl font-bold sm:text-4xl">Find a campus-compatible roommate</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-white/65">
              Filter spaces and seekers by budget, move-in timing, and practical apartment needs.
              The same controls shape both lists, so you can see the supply side and the demand side
              of a campus housing market at the same time.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
            <Link
              href="/match/profile"
              onClick={() => trackEvent('match_page_cta_clicked', { target: '/match/profile' })}
            >
              <Button variant="secondary" className="w-full sm:w-auto">Edit profile</Button>
            </Link>
            <Link
              href="/match/post-space"
              onClick={() => trackEvent('match_page_cta_clicked', { target: '/match/post-space' })}
            >
              <Button className="w-full sm:w-auto">Post a space</Button>
            </Link>
            <Link
              href="/match/post-seeker"
              onClick={() => trackEvent('match_page_cta_clicked', { target: '/match/post-seeker' })}
            >
              <Button variant="secondary" className="w-full sm:w-auto">Post as seeker</Button>
            </Link>
            <Link
              href="/match/my-matches"
              onClick={() => trackEvent('match_page_cta_clicked', { target: '/match/my-matches' })}
            >
              <Button variant="secondary" className="w-full sm:w-auto">My matches</Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Spaces live
            </p>
            <p className="mt-3 text-3xl font-bold text-white">{spaces.length}</p>
            <p className="mt-1 text-sm text-white/55">Filtered listings currently in the feed.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Seekers live
            </p>
            <p className="mt-3 text-3xl font-bold text-white">{seekers.length}</p>
            <p className="mt-1 text-sm text-white/55">People actively looking under the same filters.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Profile readiness
            </p>
            <p className="mt-3 text-3xl font-bold text-white">{savedPreferenceCount}</p>
            <p className="mt-1 text-sm text-white/55">Saved preference signal{savedPreferenceCount === 1 ? '' : 's'} to reuse.</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
        <Card className="space-y-6 border-white/10 bg-white/[0.04]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Campus filters</h2>
              <p className="mt-1 text-sm text-white/55">
                Amenity filters apply to actual space features and to the apartment needs listed by seekers.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex min-h-11 items-center rounded-full border border-white/15 bg-white/5 px-4 text-sm font-medium whitespace-nowrap text-white/70">
                {appliedFilterCount} filter{appliedFilterCount === 1 ? '' : 's'} active
              </span>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setFilters(INITIAL_FILTERS);
                  trackEvent('match_filters_reset');
                }}
                disabled={appliedFilterCount === 0}
              >
                Reset filters
              </Button>
            </div>
          </div>

          {!profileLoading && savedProfile && (
            <div className="rounded-2xl border border-sky-400/20 bg-sky-400/5 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300/80">
                    Saved profile defaults
                  </p>
                  <p className="font-medium text-white">
                    {savedProfile.full_name || 'Your renter profile'}
                    {savedCampusLabel ? ` · ${savedCampusLabel}` : ''}
                  </p>
                  <p className="text-sm text-white/60">
                    {hasSavedPreferences
                      ? `${savedPreferenceCount} saved preference signal${savedPreferenceCount === 1 ? '' : 's'} ready to reuse in search.`
                      : 'Add housing defaults in your profile, then apply them here in one click.'}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/match/profile"
                    onClick={() => trackEvent('match_page_cta_clicked', { target: '/match/profile', source: 'saved_defaults' })}
                  >
                    <Button variant="secondary" className="w-full sm:w-auto">Open profile</Button>
                  </Link>
                  <Button onClick={applySavedPreferences} disabled={!hasSavedPreferences} className="w-full sm:w-auto">
                    Use saved preferences
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                City
              </label>
              <Input
                placeholder="Chicago"
                value={filters.city}
                onChange={(event) => updateFilter('city', event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                State
              </label>
              <select
                value={filters.state}
                onChange={(event) => updateFilter('state', event.target.value)}
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
                Monthly budget target
              </label>
              <Input
                type="number"
                min="0"
                step="50"
                placeholder="1200"
                value={filters.budget}
                onChange={(event) => updateFilter('budget', event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                Move in by
              </label>
              <Input
                type="date"
                value={filters.move_in_by}
                onChange={(event) => updateFilter('move_in_by', event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Apartment must-haves
            </p>
            <div className="flex flex-wrap gap-3">
              {AMENITY_FILTERS.map((filter) => {
                const active = filters[filter.key];
                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => toggleAmenity(filter.key)}
                    className={`inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition ${
                      active
                        ? 'border-brand-green/50 bg-brand-green/15 text-brand-green'
                        : 'border-white/15 bg-white/[0.03] text-white/70 hover:border-white/25 hover:bg-white/[0.06]'
                    }`}
                  >
                    <span>{filter.icon}</span>
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card className="space-y-5 border-white/10 bg-brand-navy/80">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Before you message
            </p>
            <h2 className="mt-3 text-xl font-semibold">Use the feed like a decision tool</h2>
          </div>

          <div className="space-y-3">
            {MATCH_GUIDE.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="font-medium text-white">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/60">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100/85">
            If nothing looks right, that is still useful signal. Tight campus markets often need one side to post first before the best matches appear.
          </div>
        </Card>
      </div>

      {error && (
        <Card className="border-amber-400/20 bg-amber-400/5 text-amber-100">
          <p className="font-medium">Couldn&apos;t load the current matching feed.</p>
          <p className="mt-1 text-sm text-amber-100/70">{error}</p>
        </Card>
      )}

      {loading && (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-3">
            <SkeletonCard className="h-32" />
            <SkeletonCard className="h-32" />
            <SkeletonCard className="h-32" />
          </div>
          <div className="space-y-3">
            <SkeletonCard className="h-32" />
            <SkeletonCard className="h-32" />
            <SkeletonCard className="h-32" />
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Spaces available</h2>
              <p className="text-sm text-white/50">
                People with a room, lease opening, or sublet that matches the current filters.
              </p>
            </div>
            <span className="inline-flex min-h-8 items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs whitespace-nowrap text-white/70">
              {spaces.length} result{spaces.length === 1 ? '' : 's'}
            </span>
          </div>

          {!loading && spaces.length === 0 && (
            <Card className="border-dashed bg-white/[0.03] p-8 text-center">
              <Home size={28} className="mx-auto text-white/20" strokeWidth={1.5} />
              <p className="mt-3 font-medium text-white/85">No spaces match these filters.</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-white/55">
                Widen your budget, relax an amenity requirement, or clear the move-in deadline to
                see more listings.
              </p>
              <div className="mt-4">
                <Link href="/match/post-space">
                  <Button className="w-full sm:w-auto">Post a space instead</Button>
                </Link>
              </div>
            </Card>
          )}

          <div className="grid gap-4">
            {spaces.map((post) => (
              <SpacePostCard key={post.id} post={post} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Seekers looking</h2>
              <p className="text-sm text-white/50">
                People whose housing needs line up with the same campus filters and budget target.
              </p>
            </div>
            <span className="inline-flex min-h-8 items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs whitespace-nowrap text-white/70">
              {seekers.length} result{seekers.length === 1 ? '' : 's'}
            </span>
          </div>

          {!loading && seekers.length === 0 && (
            <Card className="border-dashed bg-white/[0.03] p-8 text-center">
              <GraduationCap size={28} className="mx-auto text-white/20" strokeWidth={1.5} />
              <p className="mt-3 font-medium text-white/85">No seekers match these filters.</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-white/55">
                Try a broader city or budget target, or turn off one of the apartment must-haves to
                surface more people.
              </p>
              <div className="mt-4">
                <Link href="/match/post-seeker">
                  <Button variant="secondary" className="w-full sm:w-auto">Post your search instead</Button>
                </Link>
              </div>
            </Card>
          )}

          <div className="grid gap-4">
            {seekers.map((post) => (
              <SeekerPostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
