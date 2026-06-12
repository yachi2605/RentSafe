import Link from 'next/link';
import { SpacePost } from '@/types';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SpacePostCardProps {
  post: SpacePost;
}

export default function SpacePostCard({ post }: SpacePostCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>{post.city}, {post.state}</CardTitle>
        <Badge tone="green">🏘️ Has a Space</Badge>
      </div>
      <CardDescription className="mt-2">
        {post.apartment_type.toUpperCase()} • ${post.your_share}/mo • {post.rooms_available} spot(s)
      </CardDescription>
      {post.poster && (
        <p className="mt-2 flex items-center gap-2 text-xs text-white/60">
          {post.poster.full_name}
          {post.poster.is_student_verified && (
            <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-sky-300">
              🎓 Verified student
            </span>
          )}
        </p>
      )}
      <p className="mt-4 text-sm text-white/70">{post.description || 'No description provided.'}</p>
      <div className="mt-4 flex items-center justify-between text-sm text-white/60">
        <span>Move-in: {post.move_in_date || 'Flexible'}</span>
        <Link href={`/match/spaces/${post.id}`} className="text-brand-green">
          View details →
        </Link>
      </div>
    </Card>
  );
}
