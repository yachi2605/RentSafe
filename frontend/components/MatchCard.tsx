import Link from 'next/link';
import { Match } from '@/types';
import MatchBadge from '@/components/MatchBadge';
import { Card } from '@/components/ui/card';

interface MatchCardProps {
  match: Match;
}

export default function MatchCard({ match }: MatchCardProps) {
  // Defensive: the backend filters out matches with missing posts, but never
  // crash the whole page if one slips through.
  if (!match.space_post || !match.seeker_post) return null;

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Match Details</h3>
        <div className="flex items-center gap-3">
          <MatchBadge score={match.score} />
          <Link
            href={`/match/chat/${match.id}`}
            className="rounded-full border border-brand-green/40 bg-brand-green/10 px-3 py-1 text-xs text-brand-green"
          >
            💬 Chat
          </Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase text-white/50">Space Post</p>
          <p className="font-semibold">{match.space_post.city}, {match.space_post.state}</p>
          <p className="text-sm text-white/70">${match.space_post.your_share}/mo</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase text-white/50">Seeker Post</p>
          <p className="font-semibold">{match.seeker_post.city}, {match.seeker_post.state}</p>
          <p className="text-sm text-white/70">Budget ${match.seeker_post.budget_min} - ${match.seeker_post.budget_max}</p>
        </div>
      </div>
      {match.breakdown && match.breakdown.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase text-white/50">Why this match</p>
          <div className="flex flex-wrap gap-2">
            {match.breakdown.map((item) => (
              <span
                key={item.factor}
                title={item.note}
                className={`rounded-full border px-3 py-1 text-xs ${
                  item.aligned
                    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                    : 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                }`}
              >
                {item.aligned ? '✓' : '!'} {item.factor}: {item.note}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
