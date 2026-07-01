'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getScamHistory } from '@/lib/api';
import { SavedScamCheck } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatHistoryDate, formatVerdictLabel, truncateText, verdictTone } from '@/lib/history';
import { getRecentScams, type RecentScamResult } from '@/lib/recent-results';
import { Clock } from 'lucide-react';

export default function ScamHistoryPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [backendItems, setBackendItems] = useState<SavedScamCheck[]>([]);
  const [localItems, setLocalItems] = useState<RecentScamResult[]>([]);
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
          const res = await getScamHistory();
          if (active) setBackendItems(res.items || []);
        } catch (err) {
          if (active) setError(err instanceof Error ? err.message : 'Failed to load scam history');
        }
      } else {
        setIsLoggedIn(false);
        if (active) setLocalItems(getRecentScams());
      }
      if (active) setLoading(false);
    };
    init();
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-amber-300/20 bg-gradient-to-br from-amber-300/12 via-white/5 to-transparent p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300/80">
              {isLoggedIn ? 'Saved checks' : 'Recent on this device'}
            </p>
            <h1 className="font-sora text-4xl font-bold">Scam history</h1>
            <p className="text-sm leading-relaxed text-white/65">
              {isLoggedIn
                ? 'Review past listing checks, compare scam signals, and reopen the full risk breakdown before you reply or send anything.'
                : 'Your last 3 scam checks from this device, kept for 7 days. Create an account to save them permanently.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/scam-checker">
              <Button>Check new listing</Button>
            </Link>
            <Link href="/history/leases">
              <Button variant="secondary">Lease history</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Anonymous banner */}
      {isLoggedIn === false && (
        <div className="flex items-start gap-4 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-5">
          <Clock size={18} className="mt-0.5 shrink-0 text-amber-300" strokeWidth={1.75} />
          <div className="flex-1">
            <p className="font-semibold text-white">These results expire in 7 days</p>
            <p className="mt-1 text-sm text-white/60">
              Create a free account to save scam checks permanently and access them from any device.
            </p>
            <Link href="/signup?next=/history/scams" className="mt-3 inline-flex">
              <Button className="h-9 text-sm">Save permanently</Button>
            </Link>
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-white/50">Loading...</p>}

      {error && (
        <Card className="border-amber-400/20 bg-amber-400/5 text-amber-100">
          <p className="font-medium">Couldn&apos;t load your scam history.</p>
          <p className="mt-1 text-sm text-amber-100/70">{error}</p>
        </Card>
      )}

      {!loading && !error && (isLoggedIn ? backendItems : localItems).length === 0 && (
        <Card className="border-dashed bg-white/[0.03] p-10 text-center">
          <p className="text-3xl">🕵️</p>
          <p className="mt-3 font-medium text-white/85">No scam checks yet.</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/55">
            {isLoggedIn
              ? 'Every listing you run through the detector will show up here so you can compare risk later.'
              : 'Scam checks you run will appear here for 7 days.'}
          </p>
          <div className="mt-5">
            <Link href="/scam-checker">
              <Button>Run your first check</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Logged-in: backend items */}
      {isLoggedIn && !loading && backendItems.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {backendItems.map((item) => (
            <Link key={item.id} href={`/history/scams/${item.id}`}>
              <Card className="h-full space-y-4 border-white/10 transition hover:-translate-y-0.5 hover:border-amber-300/40 hover:bg-white/[0.07]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                      {formatHistoryDate(item.created_at)}
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-white">
                      {truncateText(item.listing_input, 90) || 'Listing check'}
                    </h2>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-amber-200">{item.result.scam_score}</div>
                    <Badge tone={verdictTone(item.result.verdict)}>
                      {formatVerdictLabel(item.result.verdict)}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="red">{item.result.red_flags.length} red flag{item.result.red_flags.length === 1 ? '' : 's'}</Badge>
                  <Badge tone="amber">{item.result.hidden_fees.length} hidden fee{item.result.hidden_fees.length === 1 ? '' : 's'}</Badge>
                  <Badge>{item.result.tips.length} safety tip{item.result.tips.length === 1 ? '' : 's'}</Badge>
                </div>
                <p className="text-sm leading-relaxed text-white/65">
                  {truncateText(item.result.red_flags.map((f) => f.flag).join(' • '), 160) ||
                    'Open the full result to review the detailed scam signals.'}
                </p>
                <p className="text-sm font-medium text-amber-200">Open full scam check →</p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Anonymous: localStorage items */}
      {isLoggedIn === false && !loading && localItems.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {localItems.map((item) => (
            <Card key={item.id} className="h-full space-y-4 border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                    {new Date(item.saved_at).toLocaleDateString()}
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-white">
                    {truncateText(item.snippet, 90) || 'Listing check'}
                  </h2>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-amber-200">{item.scam_score}</div>
                  <Badge tone={verdictTone(item.verdict)}>{formatVerdictLabel(item.verdict)}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="red">{item.flag_count} red flag{item.flag_count === 1 ? '' : 's'}</Badge>
              </div>
              <p className="text-xs text-white/30">
                Sign in to reopen the full analysis and save it permanently.
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
