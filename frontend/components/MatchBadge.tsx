import { cn } from '@/lib/utils';

interface MatchBadgeProps {
  score: number;
}

export default function MatchBadge({ score }: MatchBadgeProps) {
  const percentage = Math.round(score * 100);
  const tone = percentage >= 85 ? 'bg-green-500' : percentage >= 70 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <span className={cn('rounded-full px-3 py-1 text-xs font-semibold text-white', tone)}>
      {percentage}% Match
    </span>
  );
}
