'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getLeaseHistory } from '@/lib/api';
import { SavedLeaseAnalysis } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatHistoryDate, leaseScoreLabel, leaseScoreTone, truncateText } from '@/lib/history';
import { getRecentLeases, type RecentLeaseResult } from '@/lib/recent-results';
import { Clock } from 'lucide-react';

export default function LeaseHistoryPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [backendItems, setBackendItems] = useState<SavedLeaseAnalysis[]>([]);
  const [localItems, setLocalItems] = useState<RecentLeaseResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const init = async () => {
      const supabase = createClientComponentClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setIsLoggedIn(true);
        try {
          const res = await getLeaseHistory();
          if (active) setBackendItems(res.items || []);
        } catch (err) {
          if (active) setError(err instanceof Error ? err.message : 'Failed to load lease history');
        }
      } else {
        setIsLoggedIn(false);
        if (active) setLocalItems(getRecentLeases());
      }
      if (active) setLoading(false);
    };
    init();
    return () => { active = false; };
  }, []);

  const items = isLoggedIn ? backendItems : localItems;

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-brand-green/20 bg-gradient-to-br from-brand-green/12 via-white/5 to-transparent p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-green/70">
              {isLoggedIn ? 'Saved analyses' : 'Recent on this device'}
            </p>
            <h1 className="font-sora text-4xl font-bold">Lease history</h1>
            <p className="text-sm leading-relaxed text-white/65">
              {isLoggedIn
                ? 'Reopen saved analyses, review red flags, and pick up the negotiation context without re-uploading the same lease every time.'
                : 'Your last 3 lease analyses from this device, kept for 7 days. Create an account to save them permanently.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/lease-analyzer">
              <Button>Analyze new lease</Button>
            </Link>
            <Link href="/history/scams">
              <Button variant="secondary">Scam history</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Anonymous banner */}
      {isLoggedIn === false && (
        <div className="flex items-start gap-4 rounded-2xl border border-brand-green/20 bg-brand-green/5 p-5">
          <Clock size={18} className="mt-0.5 shrink-0 text-brand-green" strokeWidth={1.75} />
          <div className="flex-1">
            <p className="font-semibold text-white">These results expire in 7 days</p>
            <p className="mt-1 text-sm text-white/60">
              Create a free account to save lease analyses permanently and access them from any device.
            </p>
            <Link href="/signup?next=/history/leases" className="mt-3 inline-flex">
              <Button className="h-9 text-sm">Save permanently</Button>
            </Link>
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-white/50">Loading...</p>}

      {error && (
        <Card className="border-amber-400/20 bg-amber-400/5 text-amber-100">
          <p className="font-medium">Couldn&apos;t load your lease history.</p>
          <p className="mt-1 text-sm text-amber-100/70">{error}</p>
        </Card>
      )}

      {!loading && !error && items.length === 0 && (
        <Card className="border-dashed bg-white/[0.03] p-10 text-center">
          <p className="text-3xl">📄</p>
          <p className="mt-3 font-medium text-white/85">No lease analyses yet.</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/55">
            {isLoggedIn
              ? 'The first time you analyze a lease, it will show up here so you can revisit the score, red flags, and negotiation tips later.'
              : 'Lease analyses you run will appear here for 7 days.'}
          </p>
          <div className="mt-5">
            <Link href="/lease-analyzer">
              <Button>Upload your first lease</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Logged-in: backend items */}
      {isLoggedIn && !loading && backendItems.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {backendItems.map((item) => (
            <Link key={item.id} href={`/history/leases/${item.id}`}>
              <Card className="h-full space-y-4 border-white/10 transition hover:-translate-y-0.5 hover:border-brand-green/40 hover:bg-white/[0.07]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                      {formatHistoryDate(item.created_at)}
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-white">{item.file_name}</h2>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-brand-green">
                      {item.result.tenant_friendly_score}/10
                    </div>
                    <Badge tone={leaseScoreTone(item.result.tenant_friendly_score)}>
                      {leaseScoreLabel(item.result.tenant_friendly_score)}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-white/65">
                  {truncateText(item.result.summary, 180)}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="red">
                    {item.result.red_flags.filter((f) => f.risk_level === 'high').length} high risk
                  </Badge>
                  <Badge>{item.result.red_flags.length} total flag{item.result.red_flags.length === 1 ? '' : 's'}</Badge>
                  <Badge>{item.result.negotiation_tips.length} tip{item.result.negotiation_tips.length === 1 ? '' : 's'}</Badge>
                </div>
                <p className="text-sm font-medium text-brand-green">Open full analysis →</p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Anonymous: localStorage items */}
      {isLoggedIn === false && !loading && localItems.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {localItems.map((item) => {
            const tone = item.score >= 7 ? 'green' : item.score >= 4 ? 'amber' : 'red';
            return (
              <Card key={item.id} className="h-full space-y-4 border-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                      {new Date(item.saved_at).toLocaleDateString()}
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-white">{item.file_name}</h2>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-brand-green">{item.score}/10</div>
                    <Badge tone={tone}>{item.score_label}</Badge>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-white/65">{truncateText(item.summary, 180)}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge>{item.flag_count} flag{item.flag_count === 1 ? '' : 's'}</Badge>
                </div>
                <p className="text-xs text-white/30">
                  Sign in to reopen the full analysis and save it permanently.
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
