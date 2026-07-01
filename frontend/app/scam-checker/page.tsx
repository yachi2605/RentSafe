'use client';

import { useState } from 'react';
import { checkScam } from '@/lib/api';
import { ScamCheckResult } from '@/types';
import { trackEvent } from '@/lib/analytics';
import SafetyNotice from '@/components/SafetyNotice';
import ScamScoreCard from '@/components/ScamScoreCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { saveRecentScam } from '@/lib/recent-results';
import SaveResultsPrompt from '@/components/SaveResultsPrompt';

const EXAMPLE_CHIPS = [
  { label: 'Craigslist ad', text: 'Spacious 2BR near downtown, $750/mo all utilities included. Owner traveling abroad. Send $1,500 deposit via Zelle to hold unit. No showings until deposit received.' },
  { label: 'Facebook Marketplace', text: 'Cozy studio apartment available immediately. $650/mo. Landlord moving overseas for work. Contact via WhatsApp only. No credit check required. First come first served.' },
  { label: 'Legitimate listing', text: 'Modern 1BR apartment in Lincoln Park. $1,450/mo + utilities. Managed by XYZ Properties. Schedule a showing at our office. Background check and 1-month deposit required.' },
];

export default function ScamCheckerPage() {
  const [listingText, setListingText] = useState('');
  const [result, setResult] = useState<ScamCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleCheck = async () => {
    if (!listingText.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    const supabase = createClientComponentClient();
    const { data: { session } } = await supabase.auth.getSession();
    setIsAnonymous(!session);

    try {
      trackEvent('scam_check_started', { input_chars: listingText.trim().length });
      const response = await checkScam(listingText);
      setResult(response);
      saveRecentScam(listingText, response as unknown as Record<string, unknown>);
      trackEvent('scam_check_completed', {
        score: response.scam_score,
        verdict: response.verdict,
        red_flag_count: response.red_flags?.length || 0,
        authenticated: !!session,
      });
    } catch (err) {
      trackEvent('scam_check_failed');
      setError(err instanceof Error ? err.message : 'Scam check failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start gap-4">
        <span className="mt-1 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-amber-300">
          <ShieldAlert size={22} strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="font-sora text-3xl font-bold sm:text-4xl">Scam Detector</h1>
          <p className="mt-1 text-sm leading-relaxed text-white/55">
            Paste any rental listing to get a scam risk score, red flags, and hidden fees — before you hand over any money.
          </p>
        </div>
      </div>

      {/* Input section */}
      <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 space-y-5">
        {/* Example chips */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35">Try an example</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => {
                  setListingText(chip.text);
                  setResult(null);
                  trackEvent('scam_example_chip_clicked', { label: chip.label });
                }}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60 transition hover:border-amber-400/30 hover:bg-amber-400/5 hover:text-amber-200"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <Textarea
          value={listingText}
          onChange={(e) => setListingText(e.target.value)}
          placeholder="Paste the listing text here — Craigslist, Facebook Marketplace, Zillow, email, text message, anything..."
          className="min-h-[200px] resize-none"
        />

        {/* Footer row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/30">
            {listingText.trim().length > 0 ? `${listingText.trim().length} characters` : 'Paste text above to get started'}
          </p>
          <div className="flex items-center gap-3">
            {listingText.trim().length > 0 && (
              <button
                type="button"
                onClick={() => { setListingText(''); setResult(null); }}
                className="text-xs text-white/30 hover:text-white/60 transition"
              >
                Clear
              </button>
            )}
            <Button
              onClick={handleCheck}
              disabled={loading || !listingText.trim()}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Analyzing…
                </>
              ) : (
                'Check listing'
              )}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {result && (
        <>
          <ScamScoreCard result={result} />
          {isAnonymous && <SaveResultsPrompt context="this scam check" />}
          {/* Safety notice after results — contextual, not preachy */}
          <SafetyNotice title="Before you respond to this listing">
            Never wire money, send a deposit, or move the conversation off-platform before you verify the place,
            the landlord, and the lease terms. If someone pressures you to act fast, treat that as part of the scam signal.
          </SafetyNotice>
        </>
      )}
    </div>
  );
}
