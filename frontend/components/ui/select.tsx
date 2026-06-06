import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:border-brand-green focus:outline-none',
      className
    )}
    {...props}
  />
));
Select.displayName = 'Select';

export { Select };
