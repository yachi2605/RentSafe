'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getMyMatches } from '@/lib/api';
import { Match } from '@/types';
import MatchCard from '@/components/MatchCard';
import { Button } from '@/components/ui/button';

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

export default function DashboardPage() {
  const supabase = createClientComponentClient();
  const [matches, setMatches] = useState<Match[]>([]);
  const [firstName, setFirstName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const response = await getMyMatches(data.user.id);
        setMatches(response.matches || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load matches');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-12">
      {/* Greeting */}
      <section className="space-y-2">
        <h1 className="font-sora text-4xl font-bold">
          {firstName ? `Hey ${firstName} 👋` : 'Welcome back 👋'}
        </h1>
        <p className="text-white/60">What do you want to do today?</p>
      </section>

      {/* Explore the tools */}
      <section className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
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

      {/* Matches */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your matches</h2>
          {matches.length > 0 && (
            <span className="rounded-full bg-brand-green/15 px-3 py-1 text-xs text-brand-green">
              {matches.length} active
            </span>
          )}
        </div>

        {loading && <p className="text-sm text-white/50">Loading matches...</p>}

        {error && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 text-sm text-amber-200/90">
            <p className="font-medium">Couldn&apos;t load your matches right now.</p>
            <p className="mt-1 text-amber-200/60">
              {error} — try refreshing in a few seconds.
            </p>
          </div>
        )}

        {!loading && !error && matches.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center">
            <p className="text-3xl">🏠</p>
            <p className="mt-3 font-medium text-white/80">No matches yet — let&apos;s change that.</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-white/50">
              Tell us what you have or what you need, and we&apos;ll find renters whose lifestyle
              actually fits yours.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/match/post-space">
                <Button>I have a space</Button>
              </Link>
              <Link href="/match/post-seeker">
                <Button variant="secondary">I need a space</Button>
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
