import Link from 'next/link';
import { Match } from '@/types';
import MatchBadge from '@/components/MatchBadge';
import { Card } from '@/components/ui/card';
import { buttonClasses } from '@/components/ui/button';

interface MatchCardProps {
  match: Match;
}

export default function MatchCard({ match }: MatchCardProps) {
  // Defensive: the backend filters out matches with missing posts, but never
  // crash the whole page if one slips through.
  if (!match.space_post || !match.seeker_post) return null;

  const strengths = (match.breakdown || []).filter((item) => item.aligned).slice(0, 3);
  const tradeoffs = (match.breakdown || []).filter((item) => !item.aligned).slice(0, 2);

  return (
    <Card className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Match Details</h3>
          <p className="max-w-2xl text-sm leading-relaxed text-white/60">
            {match.summary || 'This match lines up across several renter lifestyle and apartment signals.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MatchBadge score={match.score} />
          <Link
            href={`/match/chat/${match.id}`}
            className={buttonClasses('secondary', 'min-h-9 border-brand-green/35 bg-brand-green/10 px-4 text-brand-green hover:bg-brand-green/18')}
          >
            💬 Chat
          </Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase text-white/50">Space Post</p>
          <p className="font-semibold">{match.space_post.city}, {match.space_post.state}</p>
          <p className="text-sm text-white/70">${match.space_post.your_share}/mo • {match.space_post.lease_duration.replace('_', ' ')}</p>
          <p className="mt-2 text-xs text-white/45">
            Move-in {match.space_post.move_in_date || 'flexible'} • {match.space_post.rooms_available} room spot
            {match.space_post.rooms_available === 1 ? '' : 's'}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase text-white/50">Seeker Post</p>
          <p className="font-semibold">{match.seeker_post.city}, {match.seeker_post.state}</p>
          <p className="text-sm text-white/70">
            Budget ${match.seeker_post.budget_min} - ${match.seeker_post.budget_max}
          </p>
          <p className="mt-2 text-xs text-white/45">
            Move-in {match.seeker_post.move_in_date || 'flexible'} • {match.seeker_post.lease_duration.replace('_', ' ')}
          </p>
        </div>
      </div>

      {match.breakdown && match.breakdown.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-[1.3fr,0.9fr]">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
              Strong fit
            </p>
            <div className="space-y-2">
              {strengths.map((item) => (
                <div
                  key={item.factor}
                  className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-sm text-emerald-100"
                >
                  <span className="font-semibold">{item.factor}:</span> {item.note}
                </div>
              ))}
              {strengths.length === 0 && (
                <p className="text-sm text-emerald-100/70">No standout strengths were recorded yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80">
              Worth discussing
            </p>
            <div className="space-y-2">
              {tradeoffs.map((item) => (
                <div
                  key={item.factor}
                  className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-sm text-amber-100"
                >
                  <span className="font-semibold">{item.factor}:</span> {item.note}
                </div>
              ))}
              {tradeoffs.length === 0 && (
                <p className="text-sm text-amber-100/70">No major friction points surfaced from the current posts.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
