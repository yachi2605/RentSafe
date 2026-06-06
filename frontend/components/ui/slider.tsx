import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, ...props }, ref) => (
    <div className={cn('flex flex-col gap-2', className)}>
      {label ? <span className="text-xs text-white/60">{label}</span> : null}
      <input
        ref={ref}
        type="range"
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-brand-green"
        {...props}
      />
    </div>
  )
);
Slider.displayName = 'Slider';
