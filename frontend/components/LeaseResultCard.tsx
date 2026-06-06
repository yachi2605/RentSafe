import { LeaseAnalysisResult } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface LeaseResultCardProps {
  result: LeaseAnalysisResult;
}

export default function LeaseResultCard({ result }: LeaseResultCardProps) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Lease Summary</h3>
        <Badge tone={result.tenant_friendly_score >= 7 ? 'green' : result.tenant_friendly_score >= 4 ? 'amber' : 'red'}>
          Score: {result.tenant_friendly_score}/10
        </Badge>
      </div>
      <p className="text-sm text-white/70">{result.summary}</p>

      <div>
        <h4 className="mb-2 font-semibold">Red Flags</h4>
        <div className="space-y-3">
          {result.red_flags.map((flag, index) => (
            <div key={index} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Badge tone={flag.risk_level === 'high' ? 'red' : flag.risk_level === 'medium' ? 'amber' : 'green'}>
                  {flag.risk_level}
                </Badge>
                <span className="font-semibold">{flag.clause}</span>
              </div>
              <p className="text-xs text-white/60">{flag.text}</p>
              <p className="mt-2 text-sm text-white/80">{flag.explanation}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 font-semibold">Negotiation Tips</h4>
        <ul className="list-disc space-y-2 pl-5 text-sm text-white/70">
          {result.negotiation_tips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
