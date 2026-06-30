import { cn } from '@/lib/utils';

interface MatchBadgeProps {
  score: number;
}

export default function MatchBadge({ score }: MatchBadgeProps) {
  const percentage = Math.round(score * 100);
  const tone = percentage >= 85 ? 'bg-green-500' : percentage >= 70 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <span className={cn('inline-flex min-h-8 shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-semibold leading-none whitespace-nowrap text-white', tone)}>
      {percentage}% Match
    </span>
  );
}
