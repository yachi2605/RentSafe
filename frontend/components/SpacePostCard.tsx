import Link from 'next/link';
import { SpacePost } from '@/types';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCampusLabel } from '@/lib/campus-profile';

interface SpacePostCardProps {
  post: SpacePost;
}

export default function SpacePostCard({ post }: SpacePostCardProps) {
  const campusLabel = formatCampusLabel(post.poster);
  const features = [
    post.is_furnished ? 'Furnished' : null,
    post.has_parking ? 'Parking' : null,
    post.has_laundry ? 'Laundry' : null,
    post.pets_allowed ? 'Pets ok' : null,
    post.has_ac ? 'AC' : null,
    post.utilities_included ? 'Utilities incl.' : null,
  ].filter(Boolean) as string[];

  return (
    <Card className="space-y-5 border-white/10 bg-white/[0.04]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
            Space available
          </p>
          <CardTitle className="mt-2">{post.city}, {post.state}</CardTitle>
          <CardDescription className="mt-2">
            {post.apartment_type.toUpperCase()} • {post.rooms_available} spot{post.rooms_available === 1 ? '' : 's'}
          </CardDescription>
        </div>
        <Badge tone="green">🏘️ Has a Space</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">Share</p>
          <p className="mt-2 text-xl font-semibold text-white">${post.your_share}/mo</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">Move-in</p>
          <p className="mt-2 text-sm font-medium text-white">{post.move_in_date || 'Flexible'}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">Lease</p>
          <p className="mt-2 text-sm font-medium capitalize text-white">
            {post.lease_duration.replace('_', ' ')}
          </p>
        </div>
      </div>

      {post.poster && (
        <div className="space-y-1 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="flex flex-wrap items-center gap-2 text-xs text-white/60">
            {post.poster.full_name}
            {post.poster.is_student_verified && (
              <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-sky-300">
                🎓 Verified student
              </span>
            )}
          </p>
          {campusLabel ? <p className="text-xs text-white/45">{campusLabel}</p> : null}
        </div>
      )}

      {features.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {features.slice(0, 5).map((feature) => (
            <Badge key={feature}>{feature}</Badge>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-brand-navy/40 p-4">
        <p className="text-sm leading-relaxed text-white/70">
          {post.description || 'No description provided yet. Open the detail view for the full listing context.'}
        </p>
      </div>
      <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-white/55">
          Total rent ${post.total_rent}/mo
        </span>
        <Link
          href={`/match/spaces/${post.id}`}
          className="inline-flex items-center justify-center rounded-full border border-brand-green/40 bg-brand-green/10 px-4 py-2 text-sm font-medium text-brand-green"
        >
          View details →
        </Link>
      </div>
    </Card>
  );
}
