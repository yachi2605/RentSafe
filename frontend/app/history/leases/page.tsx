'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getLeaseHistory } from '@/lib/api';
import { SavedLeaseAnalysis } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatHistoryDate, leaseScoreLabel, leaseScoreTone, truncateText } from '@/lib/history';

export default function LeaseHistoryPage() {
  const [items, setItems] = useState<SavedLeaseAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await getLeaseHistory();
        if (active) {
          setItems(response.items || []);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load lease history');
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
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-brand-green/20 bg-gradient-to-br from-brand-green/12 via-white/5 to-transparent p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-green/70">
              Saved analyses
            </p>
            <h1 className="font-sora text-4xl font-bold">Lease history</h1>
            <p className="text-sm leading-relaxed text-white/65">
              Reopen saved analyses, review red flags, and pick up the negotiation context without
              re-uploading the same lease every time.
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

      {loading && <p className="text-sm text-white/50">Loading saved lease analyses...</p>}

      {error && (
        <Card className="border-amber-400/20 bg-amber-400/5 text-amber-100">
          <p className="font-medium">Couldn&apos;t load your lease history.</p>
          <p className="mt-1 text-sm text-amber-100/70">{error}</p>
        </Card>
      )}

      {!loading && !error && items.length === 0 && (
        <Card className="border-dashed bg-white/[0.03] p-10 text-center">
          <p className="text-3xl">📄</p>
          <p className="mt-3 font-medium text-white/85">No saved lease analyses yet.</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/55">
            The first time you analyze a lease, it will show up here so you can revisit the score,
            red flags, and negotiation tips later.
          </p>
          <div className="mt-5">
            <Link href="/lease-analyzer">
              <Button>Upload your first lease</Button>
            </Link>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
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
                  {item.result.red_flags.filter((flag) => flag.risk_level === 'high').length} high risk
                </Badge>
                <Badge>
                  {item.result.red_flags.length} total flag
                  {item.result.red_flags.length === 1 ? '' : 's'}
                </Badge>
                <Badge>
                  {item.result.negotiation_tips.length} negotiation tip
                  {item.result.negotiation_tips.length === 1 ? '' : 's'}
                </Badge>
              </div>

              <p className="text-sm font-medium text-brand-green">Open full analysis →</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
