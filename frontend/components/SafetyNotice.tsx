import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SafetyNoticeProps {
  title: string;
  children: ReactNode;
  tone?: 'amber' | 'red';
}

export default function SafetyNotice({ title, children, tone = 'amber' }: SafetyNoticeProps) {
  const tones = {
    amber: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
    red: 'border-red-400/30 bg-red-400/10 text-red-100',
  };

  return (
    <div className={cn('rounded-2xl border p-4', tones[tone])}>
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-2 text-sm leading-relaxed opacity-90">{children}</div>
    </div>
  );
}
