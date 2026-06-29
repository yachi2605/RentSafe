'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getScamHistoryDetail } from '@/lib/api';
import ScamScoreCard from '@/components/ScamScoreCard';
import { SavedScamCheck } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatHistoryDate, truncateText } from '@/lib/history';

export default function ScamHistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const checkId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [item, setItem] = useState<SavedScamCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!checkId) {
      setError('Missing scam check id.');
      setLoading(false);
      return;
    }

    let active = true;

    const load = async () => {
      try {
        const response = await getScamHistoryDetail(checkId);
        if (active) {
          setItem(response);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load scam check');
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
  }, [checkId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Link href="/history/scams" className="text-sm font-medium text-amber-200">
            ← Back to scam history
          </Link>
          <h1 className="font-sora text-3xl font-bold">Saved scam check</h1>
          {item && (
            <p className="max-w-3xl text-sm text-white/55">
              Saved {formatHistoryDate(item.created_at)} · {truncateText(item.listing_input, 140)}
            </p>
          )}
        </div>
        <Link href="/scam-checker">
          <Button>Check another listing</Button>
        </Link>
      </div>

      {loading && <p className="text-sm text-white/50">Loading scam check...</p>}

      {error && (
        <Card className="border-amber-400/20 bg-amber-400/5 text-amber-100">
          <p className="font-medium">Couldn&apos;t load this saved scam check.</p>
          <p className="mt-1 text-sm text-amber-100/70">{error}</p>
        </Card>
      )}

      {item && (
        <>
          <Card className="space-y-3 border-white/10 bg-white/[0.04]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300/80">
              Listing snapshot
            </p>
            <p className="text-sm leading-relaxed text-white/70">{item.listing_input}</p>
          </Card>

          <ScamScoreCard result={item.result} />
        </>
      )}
    </div>
  );
}
