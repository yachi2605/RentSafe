import { SeekerPost } from '@/types';

async function getSeeker(id: string): Promise<SeekerPost> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/match/seekers/${id}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to load seeker post');
  }
  return res.json();
}

export default async function SeekerDetailPage({ params }: { params: { id: string } }) {
  const seeker = await getSeeker(params.id);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Seeker in {seeker.city}, {seeker.state}</h1>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <p className="text-white/70">Budget: ${seeker.budget_min} - ${seeker.budget_max}</p>
        <p className="text-white/70">Lease duration: {seeker.lease_duration}</p>
        <p className="text-white/70">Move-in: {seeker.move_in_date || 'Flexible'}</p>
        <p className="text-white/70">Bio: {seeker.bio || 'No bio provided.'}</p>
      </div>
    </div>
  );
}
