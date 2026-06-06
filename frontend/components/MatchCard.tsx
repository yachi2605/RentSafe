import { Match } from '@/types';
import MatchBadge from '@/components/MatchBadge';
import { Card } from '@/components/ui/card';

interface MatchCardProps {
  match: Match;
}

export default function MatchCard({ match }: MatchCardProps) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Match Details</h3>
        <MatchBadge score={match.score} />
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
    </Card>
  );
}
