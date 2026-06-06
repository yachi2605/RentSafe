import { SpacePost } from '@/types';

async function getSpace(id: string): Promise<SpacePost> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/match/spaces/${id}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to load space post');
  }
  return res.json();
}

export default async function SpaceDetailPage({ params }: { params: { id: string } }) {
  const space = await getSpace(params.id);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Space in {space.city}, {space.state}</h1>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <p className="text-white/70">Apartment type: {space.apartment_type}</p>
        <p className="text-white/70">Your share: ${space.your_share}</p>
        <p className="text-white/70">Lease type: {space.lease_type}</p>
        <p className="text-white/70">Move-in: {space.move_in_date || 'Flexible'}</p>
        <p className="text-white/70">Description: {space.description || 'No description provided.'}</p>
      </div>
    </div>
  );
}
