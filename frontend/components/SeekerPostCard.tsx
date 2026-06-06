import Link from 'next/link';
import { SeekerPost } from '@/types';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SeekerPostCardProps {
  post: SeekerPost;
}

export default function SeekerPostCard({ post }: SeekerPostCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>{post.city}, {post.state}</CardTitle>
        <Badge tone="amber">🔍 Needs a Space</Badge>
      </div>
      <CardDescription className="mt-2">
        Budget: ${post.budget_min} - ${post.budget_max} • {post.lease_duration.replace('_', ' ')}
      </CardDescription>
      <p className="mt-4 text-sm text-white/70">{post.bio || 'No bio provided.'}</p>
      <div className="mt-4 flex items-center justify-between text-sm text-white/60">
        <span>Move-in: {post.move_in_date || 'Flexible'}</span>
        <Link href={`/match/seekers/${post.id}`} className="text-brand-green">
          View details →
        </Link>
      </div>
    </Card>
  );
}
