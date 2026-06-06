import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'green' | 'amber' | 'red' | 'neutral';
}

export const Badge = ({ className, tone = 'neutral', ...props }: BadgeProps) => {
  const tones: Record<string, string> = {
    green: 'bg-green-500/15 text-green-300 border-green-500/40',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    red: 'bg-red-500/15 text-red-300 border-red-500/40',
    neutral: 'bg-white/10 text-white/80 border-white/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
        tones[tone],
        className
      )}
      {...props}
    />
  );
};
