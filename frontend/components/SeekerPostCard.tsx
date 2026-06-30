import Link from 'next/link';
import { SeekerPost } from '@/types';
import { buttonClasses } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCampusLabel } from '@/lib/campus-profile';

interface SeekerPostCardProps {
  post: SeekerPost;
}

export default function SeekerPostCard({ post }: SeekerPostCardProps) {
  const campusLabel = formatCampusLabel(post.seeker);
  const needs = [
    post.needs_furnished ? 'Needs furnished' : null,
    post.needs_parking ? 'Needs parking' : null,
    post.needs_laundry ? 'Needs laundry' : null,
    post.needs_pets_allowed ? 'Needs pets ok' : null,
    post.needs_ac ? 'Needs AC' : null,
    post.needs_utilities_included ? 'Needs utilities incl.' : null,
  ].filter(Boolean) as string[];

  return (
    <Card className="space-y-6 border-white/10 bg-white/[0.04]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
            Seeker profile
          </p>
          <CardTitle className="mt-2">{post.city}, {post.state}</CardTitle>
          <CardDescription className="mt-2">
            {post.lease_duration.replace('_', ' ')} • move-in {post.move_in_date || 'flexible'}
          </CardDescription>
        </div>
        <Badge tone="amber">🔍 Needs a Space</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">Budget</p>
          <p className="mt-2 text-lg font-semibold text-white">
            ${post.budget_min} - ${post.budget_max}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">Move-in</p>
          <p className="mt-2 text-sm font-medium text-white">{post.move_in_date || 'Flexible'}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">Schedule</p>
          <p className="mt-2 text-sm font-medium capitalize text-white">
            {post.schedule.replace('_', ' ')}
          </p>
        </div>
      </div>

      {post.seeker && (
        <div className="space-y-1 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-white/75">
            {post.seeker.full_name}
            {post.seeker.is_student_verified && (
              <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-sky-300">
                🎓 Verified student
              </span>
            )}
          </p>
          {campusLabel ? <p className="text-xs text-white/45">{campusLabel}</p> : null}
        </div>
      )}

      {needs.length > 0 && (
        <div className="flex flex-wrap gap-2.5">
          {needs.slice(0, 5).map((need) => (
            <Badge key={need}>{need}</Badge>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-brand-navy/40 p-4">
        <p className="text-sm leading-relaxed text-white/70">
          {post.bio || 'No bio provided yet. Open the detail view to see the full seeker context.'}
        </p>
      </div>
      <div className="grid gap-4 border-t border-white/10 pt-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <span className="text-sm text-white/55">
          See the full seeker profile, preferences, and fit details before you decide to message.
        </span>
        <Link
          href={`/match/seekers/${post.id}`}
          className={buttonClasses('secondary', 'border-amber-300/35 bg-amber-300/10 text-amber-200 hover:bg-amber-300/18')}
        >
          View details →
        </Link>
      </div>
    </Card>
  );
}
