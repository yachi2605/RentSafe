import { ScamCheckResult } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ScamScoreCardProps {
  result: ScamCheckResult;
}

const verdictTone: Record<string, 'green' | 'amber' | 'red'> = {
  likely_legit: 'green',
  possibly_legit: 'green',
  suspicious: 'amber',
  likely_scam: 'red',
};

export default function ScamScoreCard({ result }: ScamScoreCardProps) {
  const tone = verdictTone[result.verdict];
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Scam Risk</h3>
        <Badge tone={tone}>{result.verdict.replace('_', ' ')}</Badge>
      </div>
      <div className="flex items-center gap-6">
        <div
          className="flex h-32 w-32 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(#22C55E ${100 - result.scam_score}%, #EF4444 ${result.scam_score}%)`,
          }}
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-navy text-2xl font-semibold">
            {result.scam_score}
          </div>
        </div>
        <div className="space-y-2 text-sm text-white/70">
          <p>Red Flags: {result.red_flags.length}</p>
          <p>Hidden Fees: {result.hidden_fees.length}</p>
        </div>
      </div>
      <div>
        <h4 className="mb-2 font-semibold">Red Flags</h4>
        <ul className="list-disc space-y-2 pl-5 text-sm text-white/70">
          {result.red_flags.map((flag, index) => (
            <li key={index}>
              <strong className="text-white">{flag.flag}: </strong>
              {flag.explanation}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="mb-2 font-semibold">Hidden Fees</h4>
        <ul className="list-disc space-y-2 pl-5 text-sm text-white/70">
          {result.hidden_fees.map((fee, index) => (
            <li key={index}>
              {fee.fee_type} — {fee.estimated_amount}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="mb-2 font-semibold">Safety Tips</h4>
        <ul className="list-disc space-y-2 pl-5 text-sm text-white/70">
          {result.tips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
