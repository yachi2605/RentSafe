'use client';

import { useState } from 'react';
import { checkScam } from '@/lib/api';
import { ScamCheckResult } from '@/types';
import ScamScoreCard from '@/components/ScamScoreCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function ScamCheckerPage() {
  const [listingText, setListingText] = useState('');
  const [result, setResult] = useState<ScamCheckResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!listingText.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await checkScam(listingText);
      setResult(response);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Scam Detector</h1>
        <p className="text-sm text-white/60">Paste any listing to assess scam risk and hidden fees.</p>
      </div>
      <Textarea
        value={listingText}
        onChange={(event) => setListingText(event.target.value)}
        placeholder="Paste the listing text or URL here..."
      />
      <Button onClick={handleCheck} disabled={loading}>
        {loading ? 'Checking...' : 'Check listing'}
      </Button>
      {result && <ScamScoreCard result={result} />}
    </div>
  );
}
