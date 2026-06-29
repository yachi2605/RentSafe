import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import ReportButton from '@/components/ReportButton';
import { SpacePost } from '@/types';
import { formatCampusLabel } from '@/lib/campus-profile';
import { formatDate, formatLabel } from '@/lib/match-detail';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

async function getSpace(id: string): Promise<SpacePost> {
  const res = await fetch(`${BACKEND_URL}/match/spaces/${id}`, { cache: 'no-store' });
  if (res.status === 404) notFound();
  if (!res.ok) {
    throw new Error('Failed to load space post');
  }
  return res.json();
}

function FeatureBadge({
  enabled,
  label,
  disabledLabel,
}: {
  enabled: boolean;
  label: string;
  disabledLabel: string;
}) {
  return <Badge tone={enabled ? 'green' : 'neutral'}>{enabled ? label : disabledLabel}</Badge>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wide text-white/45">{label}</p>
      <p className="mt-1 text-sm text-white/85">{value}</p>
    </div>
  );
}

export default async function SpaceDetailPage({ params }: { params: { id: string } }) {
  const space = await getSpace(params.id);
  const campusLabel = formatCampusLabel(space.poster);

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="green">Has a space</Badge>
            <ReportButton
              label="Report listing"
              subjectLabel="this space listing"
              targetId={space.id}
              targetType="space_post"
            />
          </div>
          <div>
            <h1 className="text-3xl font-semibold">
              {space.city}, {space.state}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-white/60">
              {space.description || 'No description provided yet. Reach out through a match to ask for more context.'}
            </p>
          </div>
        </div>
        <Card className="w-full max-w-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/45">Roommate share</p>
              <p className="mt-1 text-3xl font-semibold text-brand-green">${space.your_share}/mo</p>
            </div>
            <Badge tone="neutral">{formatLabel(space.apartment_type)}</Badge>
          </div>
          <p className="text-sm text-white/65">
            Total rent ${space.total_rent}/mo · {space.rooms_available} open spot{space.rooms_available > 1 ? 's' : ''}
          </p>
          {space.poster ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/75">
              <p className="font-medium text-white">{space.poster.full_name}</p>
              <p className="mt-1 text-xs text-white/55">
                {space.poster.is_student_verified ? 'Verified student' : 'Community member'}
              </p>
              {campusLabel ? <p className="mt-1 text-xs text-white/45">{campusLabel}</p> : null}
            </div>
          ) : null}
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DetailRow label="Move-in" value={formatDate(space.move_in_date)} />
        <DetailRow label="Lease type" value={formatLabel(space.lease_type)} />
        <DetailRow label="Lease duration" value={formatLabel(space.lease_duration)} />
        <DetailRow label="ZIP code" value={space.zip || 'Not provided'} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">What the home includes</h2>
            <p className="mt-1 text-sm text-white/55">
              These are the features seekers can match against immediately.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <FeatureBadge enabled={space.is_furnished} label="Furnished" disabledLabel="Unfurnished" />
            <FeatureBadge enabled={space.has_parking} label="Parking" disabledLabel="No parking" />
            <FeatureBadge enabled={space.has_laundry} label="Laundry" disabledLabel="No laundry" />
            <FeatureBadge enabled={space.pets_allowed} label="Pets allowed" disabledLabel="No pets" />
            <FeatureBadge enabled={space.has_ac} label="Air conditioning" disabledLabel="No AC" />
            <FeatureBadge enabled={space.utilities_included} label="Utilities included" disabledLabel="Utilities extra" />
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Roommate fit</h2>
            <p className="mt-1 text-sm text-white/55">
              These preferences drive the compatibility score.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="Cleanliness" value={`${space.pref_cleanliness}/5`} />
            <DetailRow label="Noise tolerance" value={`${space.pref_noise_tolerance}/5`} />
            <DetailRow label="Guests" value={`${space.pref_guests_frequency}/5`} />
            <DetailRow label="Schedule" value={formatLabel(space.pref_schedule)} />
            <DetailRow label="Smoking" value={space.pref_smoking_ok ? 'Smoking is okay' : 'Non-smoking home'} />
            <DetailRow label="Listing status" value={space.is_active ? 'Active' : 'Inactive'} />
          </div>
        </Card>
      </section>
    </div>
  );
}
