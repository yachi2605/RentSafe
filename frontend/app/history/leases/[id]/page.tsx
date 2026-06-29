'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getLeaseHistoryDetail } from '@/lib/api';
import LeaseResultCard from '@/components/LeaseResultCard';
import { SavedLeaseAnalysis } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatHistoryDate } from '@/lib/history';

export default function LeaseHistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const analysisId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [item, setItem] = useState<SavedLeaseAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!analysisId) {
      setError('Missing lease analysis id.');
      setLoading(false);
      return;
    }

    let active = true;

    const load = async () => {
      try {
        const response = await getLeaseHistoryDetail(analysisId);
        if (active) {
          setItem(response);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load lease analysis');
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
  }, [analysisId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Link href="/history/leases" className="text-sm font-medium text-brand-green">
            ← Back to lease history
          </Link>
          <h1 className="font-sora text-3xl font-bold">
            {item?.file_name || 'Saved lease analysis'}
          </h1>
          {item && (
            <p className="text-sm text-white/55">Saved {formatHistoryDate(item.created_at)}</p>
          )}
        </div>
        <Link href="/lease-analyzer">
          <Button>Analyze another lease</Button>
        </Link>
      </div>

      {loading && <p className="text-sm text-white/50">Loading lease analysis...</p>}

      {error && (
        <Card className="border-amber-400/20 bg-amber-400/5 text-amber-100">
          <p className="font-medium">Couldn&apos;t load this saved lease analysis.</p>
          <p className="mt-1 text-sm text-amber-100/70">{error}</p>
        </Card>
      )}

      {item && (
        <>
          <Card className="flex flex-col gap-3 border-white/10 bg-white/[0.04] lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-green/70">
                Saved result
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                This is the stored analysis snapshot for your lease, so you can revisit the score,
                risks, and negotiation points without uploading the file again.
              </p>
            </div>
            {item.result.extracted_text && (
              <div className="rounded-2xl border border-brand-green/20 bg-brand-green/10 px-4 py-3 text-sm text-brand-green">
                Full lease text was saved with this result for future reuse.
              </div>
            )}
          </Card>

          <LeaseResultCard result={item.result} />
        </>
      )}
    </div>
  );
}
