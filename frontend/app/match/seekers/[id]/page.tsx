import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import ReportButton from '@/components/ReportButton';
import { SeekerPost } from '@/types';
import { formatCampusLabel } from '@/lib/campus-profile';
import { formatDate, formatLabel } from '@/lib/match-detail';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

async function getSeeker(id: string): Promise<SeekerPost> {
  const res = await fetch(`${BACKEND_URL}/match/seekers/${id}`, { cache: 'no-store' });
  if (res.status === 404) notFound();
  if (!res.ok) {
    throw new Error('Failed to load seeker post');
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

export default async function SeekerDetailPage({ params }: { params: { id: string } }) {
  const seeker = await getSeeker(params.id);
  const campusLabel = formatCampusLabel(seeker.seeker);

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="amber">Needs a space</Badge>
            <ReportButton
              label="Report listing"
              subjectLabel="this seeker post"
              targetId={seeker.id}
              targetType="seeker_post"
            />
          </div>
          <div>
            <h1 className="text-3xl font-semibold">
              {seeker.city}, {seeker.state}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-white/60">
              {seeker.bio || 'No bio provided yet. A match conversation will be the best place to ask more.'}
            </p>
          </div>
        </div>
        <Card className="w-full max-w-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/45">Budget range</p>
              <p className="mt-1 text-3xl font-semibold text-brand-green">
                ${seeker.budget_min} - ${seeker.budget_max}
              </p>
            </div>
            <Badge tone="neutral">{formatLabel(seeker.lease_duration)}</Badge>
          </div>
          <p className="text-sm text-white/65">Target move-in {formatDate(seeker.move_in_date)}</p>
          {seeker.seeker ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/75">
              <p className="font-medium text-white">{seeker.seeker.full_name}</p>
              <p className="mt-1 text-xs text-white/55">
                {seeker.seeker.is_student_verified ? 'Verified student' : 'Community member'}
              </p>
              {campusLabel ? <p className="mt-1 text-xs text-white/45">{campusLabel}</p> : null}
            </div>
          ) : null}
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DetailRow label="Move-in" value={formatDate(seeker.move_in_date)} />
        <DetailRow label="Lease duration" value={formatLabel(seeker.lease_duration)} />
        <DetailRow label="Schedule" value={formatLabel(seeker.schedule)} />
        <DetailRow label="Smoking" value={seeker.smoking ? 'Smoker' : 'Non-smoker'} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Must-have home features</h2>
            <p className="mt-1 text-sm text-white/55">
              These are the filters that matter most when matching this seeker to a space.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <FeatureBadge enabled={seeker.needs_furnished} label="Needs furnished" disabledLabel="Furnished optional" />
            <FeatureBadge enabled={seeker.needs_parking} label="Needs parking" disabledLabel="Parking optional" />
            <FeatureBadge enabled={seeker.needs_laundry} label="Needs laundry" disabledLabel="Laundry optional" />
            <FeatureBadge enabled={seeker.needs_pets_allowed} label="Needs pet-friendly home" disabledLabel="Pets optional" />
            <FeatureBadge enabled={seeker.needs_ac} label="Needs air conditioning" disabledLabel="AC optional" />
            <FeatureBadge enabled={seeker.needs_utilities_included} label="Needs utilities included" disabledLabel="Utilities flexible" />
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Living style</h2>
            <p className="mt-1 text-sm text-white/55">
              These traits are compared against poster preferences in the match score.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="Cleanliness" value={`${seeker.cleanliness}/5`} />
            <DetailRow label="Noise level" value={`${seeker.noise_level}/5`} />
            <DetailRow label="Guests" value={`${seeker.guests_frequency}/5`} />
            <DetailRow label="Schedule" value={formatLabel(seeker.schedule)} />
            <DetailRow label="Listing status" value={seeker.is_active ? 'Active' : 'Inactive'} />
            <DetailRow label="Profile summary" value={seeker.bio ? 'Provided' : 'Not provided'} />
          </div>
        </Card>
      </section>
    </div>
  );
}
