import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function buttonClasses(variant: ButtonProps['variant'] = 'primary', className?: string) {
  const base =
    'inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-semibold leading-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/50 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy disabled:cursor-not-allowed disabled:opacity-50';
  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-brand-green text-white shadow-[0_10px_30px_rgba(34,197,94,0.22)] hover:bg-green-400',
    secondary: 'border border-white/14 bg-white/[0.06] text-white hover:border-white/25 hover:bg-white/[0.12]',
    ghost: 'bg-transparent text-white/80 hover:bg-white/[0.06] hover:text-white',
  };

  return cn(base, variants[variant], className);
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonClasses(variant, className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
