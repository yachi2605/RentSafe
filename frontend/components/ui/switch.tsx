import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(({ className, ...props }, ref) => (
  <label className={cn('relative inline-flex cursor-pointer items-center', className)}>
    <input ref={ref} type="checkbox" className="peer sr-only" {...props} />
    <span className="h-6 w-11 rounded-full bg-white/20 transition peer-checked:bg-brand-green" />
    <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
  </label>
));
Switch.displayName = 'Switch';
