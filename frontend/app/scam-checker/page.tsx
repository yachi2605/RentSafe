'use client';

import { useState } from 'react';
import { checkScam } from '@/lib/api';
import { ScamCheckResult } from '@/types';
import { trackEvent } from '@/lib/analytics';
import SafetyNotice from '@/components/SafetyNotice';
import ScamScoreCard from '@/components/ScamScoreCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function ScamCheckerPage() {
  const [listingText, setListingText] = useState('');
  const [result, setResult] = useState<ScamCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!listingText.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      trackEvent('scam_check_started', { input_chars: listingText.trim().length });
      const response = await checkScam(listingText);
      setResult(response);
      trackEvent('scam_check_completed', {
        score: response.scam_score,
        verdict: response.verdict,
        red_flag_count: response.red_flags?.length || 0,
      });
    } catch (err) {
      trackEvent('scam_check_failed');
      setError(err instanceof Error ? err.message : 'Scam check failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold sm:text-4xl">Scam Detector</h1>
        <p className="text-sm text-white/60">Paste any listing to assess scam risk and hidden fees.</p>
      </div>
      <SafetyNotice title="Safety reminder">
        Never wire money, send a deposit, or move the conversation off-platform before you verify the place,
        the landlord, and the lease terms. If someone pressures you to act fast, treat that as part of the scam signal.
      </SafetyNotice>
      <Textarea
        value={listingText}
        onChange={(event) => setListingText(event.target.value)}
        placeholder="Paste the listing text or URL here..."
        className="min-h-[220px]"
      />
      <Button onClick={handleCheck} disabled={loading} className="w-full sm:w-auto">
        {loading ? 'Checking...' : 'Check listing'}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {result && <ScamScoreCard result={result} />}
    </div>
  );
}
