import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
}

export const Progress = ({ value, className, ...props }: ProgressProps) => (
  <div
    className={cn('h-2 w-full rounded-full bg-white/10', className)}
    {...props}
  >
    <div
      className="h-full rounded-full bg-gradient-to-r from-green-400 via-amber-400 to-red-500"
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    />
  </div>
);
