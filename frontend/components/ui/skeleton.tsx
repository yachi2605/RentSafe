import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-2xl bg-white/[0.06]', className)}
      {...props}
    />
  );
}

/** A full card-shaped skeleton that matches the standard Card dimensions */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-white/10 bg-white/5 p-6', className)}>
      <Skeleton className="mb-4 h-3 w-24 rounded-full" />
      <Skeleton className="mb-2 h-6 w-3/4 rounded-xl" />
      <Skeleton className="h-4 w-full rounded-xl" />
      <Skeleton className="mt-1 h-4 w-5/6 rounded-xl" />
    </div>
  );
}

/** Stat tile skeleton (used in dashboard + match page headers) */
export function SkeletonStat({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-white/10 bg-white/[0.04] p-4', className)}>
      <Skeleton className="mb-3 h-2.5 w-20 rounded-full" />
      <Skeleton className="mb-1 h-8 w-12 rounded-lg" />
      <Skeleton className="h-3 w-36 rounded-full" />
    </div>
  );
}

/** Activity row skeleton (lease/scam history items) */
export function SkeletonActivityRow({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-white/10 bg-brand-navy/50 p-4', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-2.5 w-20 rounded-full" />
          <Skeleton className="h-5 w-48 rounded-lg" />
          <Skeleton className="h-3.5 w-full rounded-full" />
          <Skeleton className="h-3.5 w-4/5 rounded-full" />
        </div>
        <div className="space-y-2 text-right">
          <Skeleton className="ml-auto h-8 w-16 rounded-lg" />
          <Skeleton className="ml-auto h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Match card skeleton */
export function SkeletonMatchCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-white/10 bg-white/[0.04] p-5', className)}>
      <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40 rounded-lg" />
          <Skeleton className="h-3.5 w-28 rounded-full" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-8 w-20 shrink-0 rounded-full" />
      </div>
    </div>
  );
}
