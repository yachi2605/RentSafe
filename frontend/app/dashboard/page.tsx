'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getLeaseHistory, getMyMatches, getScamHistory } from '@/lib/api';
import { Match, SavedLeaseAnalysis, SavedScamCheck } from '@/types';
import MatchCard from '@/components/MatchCard';
import { trackEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  formatHistoryDate,
  formatVerdictLabel,
  leaseScoreLabel,
  leaseScoreTone,
  truncateText,
  verdictTone,
} from '@/lib/history';

const FEATURES = [
  {
    href: '/lease-analyzer',
    icon: '📄',
    title: 'Lease Analyzer',
    text: 'Upload a lease PDF and get red flags, negotiation tips, and a tenant-friendliness score.',
    action: 'Analyze a lease',
  },
  {
    href: '/scam-checker',
    icon: '🕵️',
    title: 'Scam Detector',
    text: 'Paste any listing and get a scam score with specific red flags and hidden fees.',
    action: 'Check a listing',
  },
  {
    href: '/tenant-rights',
    icon: '⚖️',
    title: 'Tenant Rights',
    text: 'Ask anything about your rights as a renter — answers specific to your state.',
    action: 'Ask a question',
  },
  {
    href: '/match',
    icon: '🤝',
    title: 'Roommate Match',
    text: 'Post a space or find one. See exactly why each match fits your lifestyle.',
    action: 'Explore matches',
  },
];

const QUICK_ACTIONS = [
  { href: '/lease-analyzer', label: 'Analyze a lease', tone: 'primary' as const },
  { href: '/scam-checker', label: 'Check a listing', tone: 'secondary' as const },
  { href: '/match/post-seeker', label: 'Post your search', tone: 'secondary' as const },
];

export default function DashboardPage() {
  const [supabase] = useState(() => createClientComponentClient());
  const [matches, setMatches] = useState<Match[]>([]);
  const [recentLeases, setRecentLeases] = useState<SavedLeaseAnalysis[]>([]);
  const [recentScams, setRecentScams] = useState<SavedScamCheck[]>([]);
  const [firstName, setFirstName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!data.user) {
          setLoading(false);
          return;
        }
        const metaName = (data.user.user_metadata?.full_name as string) || '';
        setFirstName(metaName.split(' ')[0] || data.user.email?.split('@')[0] || '');
        const [matchesResult, leasesResult, scamsResult] = await Promise.allSettled([
          getMyMatches(data.user.id),
          getLeaseHistory(3),
          getScamHistory(3),
        ]);

        if (matchesResult.status === 'fulfilled') {
          setMatches(matchesResult.value.matches || []);
        } else {
          setMatchError(
            matchesResult.reason instanceof Error
              ? matchesResult.reason.message
              : 'Failed to load matches',
          );
        }

        if (leasesResult.status === 'fulfilled') {
          setRecentLeases(leasesResult.value.items || []);
        }

        if (scamsResult.status === 'fulfilled') {
          setRecentScams(scamsResult.value.items || []);
        }

        if (leasesResult.status === 'rejected' || scamsResult.status === 'rejected') {
          const parts: string[] = [];
          if (leasesResult.status === 'rejected') {
            parts.push(
              leasesResult.reason instanceof Error
                ? leasesResult.reason.message
                : 'Failed to load lease activity',
            );
          }
          if (scamsResult.status === 'rejected') {
            parts.push(
              scamsResult.reason instanceof Error
                ? scamsResult.reason.message
                : 'Failed to load scam activity',
            );
          }
          setActivityError(parts.join(' • '));
        }
      } catch (err) {
        setMatchError(err instanceof Error ? err.message : 'Failed to load matches');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [supabase]);

  return (
    <div className="space-y-10 sm:space-y-12">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-5 border-brand-green/15 bg-[radial-gradient(circle_at_top_left,_rgba(61,217,151,0.16),_transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 sm:p-8">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-brand-green/70">
              Dashboard
            </p>
            <h1 className="font-sora text-3xl font-bold sm:text-4xl">
              {firstName ? `Hey ${firstName} 👋` : 'Welcome back 👋'}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">
              Pick up the highest-value renter task first: review a lease, vet a listing, or post what you need.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                onClick={() => trackEvent('dashboard_quick_action_clicked', { target: action.href })}
              >
                <Button variant={action.tone} className="w-full sm:w-auto">
                  {action.label}
                </Button>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="grid gap-4 border-white/10 bg-brand-navy/80 p-5 sm:grid-cols-3 xl:grid-cols-1">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Active matches
            </p>
            <p className="mt-3 text-3xl font-bold text-white">{matches.length}</p>
            <p className="mt-1 text-sm text-white/55">Potential roommate fits currently saved for you.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Saved leases
            </p>
            <p className="mt-3 text-3xl font-bold text-white">{recentLeases.length}</p>
            <p className="mt-1 text-sm text-white/55">Recent lease analyses ready to reopen.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Scam checks
            </p>
            <p className="mt-3 text-3xl font-bold text-white">{recentScams.length}</p>
            <p className="mt-1 text-sm text-white/55">Listing checks you can revisit before paying anything.</p>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            onClick={() => trackEvent('dashboard_feature_clicked', { feature: feature.title, target: feature.href })}
            className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition
                       hover:-translate-y-0.5 hover:border-brand-green/40 hover:bg-white/[0.07]"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{feature.icon}</span>
              <div className="space-y-1.5">
                <h2 className="text-lg font-semibold">{feature.title}</h2>
                <p className="text-sm leading-relaxed text-white/60">{feature.text}</p>
                <p className="pt-1 text-sm font-medium text-brand-green opacity-0 transition group-hover:opacity-100">
                  {feature.action} →
                </p>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Recent activity</h2>
            <p className="text-sm text-white/50">Pick up where you left off across saved analyses and checks.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/history/leases" onClick={() => trackEvent('dashboard_history_clicked', { type: 'lease' })}>
              <Button variant="secondary" className="w-full sm:w-auto">Lease history</Button>
            </Link>
            <Link href="/history/scams" onClick={() => trackEvent('dashboard_history_clicked', { type: 'scam' })}>
              <Button variant="secondary" className="w-full sm:w-auto">Scam history</Button>
            </Link>
          </div>
        </div>

        {activityError && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 text-sm text-amber-200/90">
            <p className="font-medium">Recent activity is partially unavailable.</p>
            <p className="mt-1 text-amber-200/60">{activityError}</p>
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="space-y-4 border-brand-green/15 bg-gradient-to-br from-brand-green/10 via-white/5 to-white/[0.03]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-green/70">
                  Lease history
                </p>
                <h3 className="mt-2 text-lg font-semibold">Saved lease analyses</h3>
              </div>
              <Link href="/history/leases" className="text-sm font-medium text-brand-green">
                View all →
              </Link>
            </div>

            {loading && recentLeases.length === 0 && (
              <p className="text-sm text-white/50">Loading saved leases...</p>
            )}

            {!loading && recentLeases.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5">
                <p className="font-medium text-white/80">No saved lease analyses yet.</p>
                <p className="mt-1 text-sm text-white/50">
                  Analyze your first lease and come back here when you need the details again.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {recentLeases.map((item) => (
                <Link
                  key={item.id}
                  href={`/history/leases/${item.id}`}
                  className="block rounded-2xl border border-white/10 bg-brand-navy/50 p-4 transition hover:border-brand-green/40 hover:bg-brand-navy/70"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                        {formatHistoryDate(item.created_at)}
                      </p>
                      <h4 className="mt-2 font-semibold text-white">{item.file_name}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-brand-green">
                        {item.result.tenant_friendly_score}/10
                      </p>
                      <Badge tone={leaseScoreTone(item.result.tenant_friendly_score)}>
                        {leaseScoreLabel(item.result.tenant_friendly_score)}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-white/60">
                    {truncateText(item.result.summary, 140)}
                  </p>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="space-y-4 border-amber-400/15 bg-gradient-to-br from-amber-400/10 via-white/5 to-white/[0.03]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300/80">
                  Scam history
                </p>
                <h3 className="mt-2 text-lg font-semibold">Saved scam checks</h3>
              </div>
              <Link href="/history/scams" className="text-sm font-medium text-amber-200">
                View all →
              </Link>
            </div>

            {loading && recentScams.length === 0 && (
              <p className="text-sm text-white/50">Loading saved scam checks...</p>
            )}

            {!loading && recentScams.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5">
                <p className="font-medium text-white/80">No scam checks saved yet.</p>
                <p className="mt-1 text-sm text-white/50">
                  Run a listing through the detector and you’ll be able to revisit the result here.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {recentScams.map((item) => (
                <Link
                  key={item.id}
                  href={`/history/scams/${item.id}`}
                  className="block rounded-2xl border border-white/10 bg-brand-navy/50 p-4 transition hover:border-amber-300/40 hover:bg-brand-navy/70"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                        {formatHistoryDate(item.created_at)}
                      </p>
                      <h4 className="mt-2 font-semibold text-white">
                        {truncateText(item.listing_input, 72) || 'Listing check'}
                      </h4>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-amber-200">
                        {item.result.scam_score}
                      </p>
                      <Badge tone={verdictTone(item.result.verdict)}>
                        {formatVerdictLabel(item.result.verdict)}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-white/60">
                    {item.result.red_flags.length} red flags · {item.result.hidden_fees.length} hidden fee
                    {item.result.hidden_fees.length === 1 ? '' : 's'}
                  </p>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Matches */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">Your matches</h2>
          {matches.length > 0 && (
            <span className="rounded-full bg-brand-green/15 px-3 py-1 text-xs text-brand-green">
              {matches.length} active
            </span>
          )}
        </div>

        {loading && <p className="text-sm text-white/50">Loading matches...</p>}

        {matchError && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 text-sm text-amber-200/90">
            <p className="font-medium">Couldn&apos;t load your matches right now.</p>
            <p className="mt-1 text-amber-200/60">
              {matchError} — try refreshing in a few seconds.
            </p>
          </div>
        )}

        {!loading && !matchError && matches.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center">
            <p className="text-3xl">🏠</p>
            <p className="mt-3 font-medium text-white/80">No matches yet — let&apos;s change that.</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-white/50">
              Tell us what you have or what you need, and we&apos;ll find renters whose lifestyle
              actually fits yours.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
              <Link
                href="/match/post-space"
                onClick={() => trackEvent('dashboard_empty_match_cta_clicked', { target: 'space' })}
              >
                <Button className="w-full sm:w-auto">I have a space</Button>
              </Link>
              <Link
                href="/match/post-seeker"
                onClick={() => trackEvent('dashboard_empty_match_cta_clicked', { target: 'seeker' })}
              >
                <Button variant="secondary" className="w-full sm:w-auto">I need a space</Button>
              </Link>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </section>
    </div>
  );
}
