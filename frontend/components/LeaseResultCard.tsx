'use client';

import { useState } from 'react';
import { LeaseAnalysisResult, LeaseRedFlag } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { negotiateClause } from '@/lib/api';

interface LeaseResultCardProps {
  result: LeaseAnalysisResult;
}

function NegotiateModal({
  flag,
  onClose,
}: {
  flag: LeaseRedFlag;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState<{ subject: string; body: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await negotiateClause(flag.clause, flag.text, flag.explanation);
      setEmail(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate email');
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!email) return;
    navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg space-y-4 rounded-2xl border border-white/10 bg-[#0f1a2e] p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">Negotiate: {flag.clause}</h3>
            <p className="text-sm text-white/50">Generate a professional email to send your landlord</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/80">✕</button>
        </div>

        {!email && (
          <>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              <p className="font-medium text-white/90">{flag.clause}</p>
              <p className="mt-1 text-xs text-white/50">&ldquo;{flag.text}&rdquo;</p>
              <p className="mt-2">{flag.explanation}</p>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button onClick={generate} disabled={loading} className="w-full">
              {loading ? 'Drafting email…' : '✉ Draft negotiation email'}
            </Button>
          </>
        )}

        {email && (
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/40">Subject</p>
              <p className="text-white/90">{email.subject}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Body</p>
              <pre className="whitespace-pre-wrap font-sans leading-relaxed text-white/80">{email.body}</pre>
            </div>
            <div className="flex gap-2">
              <Button onClick={copy} className="flex-1">
                {copied ? '✓ Copied!' : '📋 Copy to clipboard'}
              </Button>
              <Button variant="secondary" onClick={() => setEmail(null)}>
                Regenerate
              </Button>
            </div>
            <p className="text-center text-xs text-white/30">
              Fill in [Your Name] and [Landlord Name] before sending
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LeaseResultCard({ result }: LeaseResultCardProps) {
  const [negotiatingFlag, setNegotiatingFlag] = useState<LeaseRedFlag | null>(null);

  const score = result.tenant_friendly_score;
  const scoreTone = score >= 7 ? 'green' : score >= 4 ? 'amber' : 'red';
  const scoreLabel = score >= 7 ? 'Tenant-friendly' : score >= 4 ? 'Mixed' : 'Landlord-heavy';

  return (
    <>
      {negotiatingFlag && (
        <NegotiateModal flag={negotiatingFlag} onClose={() => setNegotiatingFlag(null)} />
      )}

      <Card className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Lease Analysis</h3>
            <p className="mt-1 text-sm text-white/60">{result.summary}</p>
          </div>
          <div className="shrink-0 text-center">
            <div className={`text-3xl font-bold ${score >= 7 ? 'text-brand-green' : score >= 4 ? 'text-amber-400' : 'text-red-400'}`}>
              {score}/10
            </div>
            <Badge tone={scoreTone}>{scoreLabel}</Badge>
          </div>
        </div>

        {/* Red Flags */}
        <div>
          <h4 className="mb-3 font-semibold">
            Red Flags
            <span className="ml-2 text-sm font-normal text-white/40">
              {result.red_flags.filter(f => f.risk_level === 'high').length} high risk
            </span>
          </h4>
          <div className="space-y-3">
            {result.red_flags.map((flag, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge tone={flag.risk_level === 'high' ? 'red' : flag.risk_level === 'medium' ? 'amber' : 'green'}>
                      {flag.risk_level}
                    </Badge>
                    <span className="font-semibold">{flag.clause}</span>
                  </div>
                  <button
                    onClick={() => setNegotiatingFlag(flag)}
                    className="shrink-0 rounded-lg border border-brand-green/30 px-3 py-1 text-xs font-medium text-brand-green hover:bg-brand-green/10 transition"
                  >
                    ✉ Negotiate
                  </button>
                </div>
                <p className="text-xs italic text-white/50">&ldquo;{flag.text}&rdquo;</p>
                <p className="mt-2 text-sm text-white/80">{flag.explanation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Negotiation Tips */}
        <div>
          <h4 className="mb-2 font-semibold">Before You Sign</h4>
          <ul className="space-y-2 text-sm text-white/70">
            {result.negotiation_tips.map((tip, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-brand-green">→</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </>
  );
}
