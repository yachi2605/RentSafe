'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listSpacePosts, listSeekerPosts } from '@/lib/api';
import { SpacePost, SeekerPost } from '@/types';
import SpacePostCard from '@/components/SpacePostCard';
import SeekerPostCard from '@/components/SeekerPostCard';
import { Button } from '@/components/ui/button';

export default function MatchPage() {
  const [spaces, setSpaces] = useState<SpacePost[]>([]);
  const [seekers, setSeekers] = useState<SeekerPost[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const spaceRes = await listSpacePosts();
        const seekerRes = await listSeekerPosts();
        setSpaces(spaceRes.spaces || []);
        setSeekers(seekerRes.seekers || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load posts');
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Space & Seeker Matcher</h1>
          <p className="text-sm text-white/60">Browse active posts from renters across the community.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/match/post-space">
            <Button>Post a space</Button>
          </Link>
          <Link href="/match/post-seeker">
            <Button variant="secondary">Post a seeker</Button>
          </Link>
          <Link href="/match/my-matches">
            <Button variant="ghost">My matches</Button>
          </Link>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Spaces available</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {spaces.map((post) => (
            <SpacePostCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Seekers looking</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {seekers.map((post) => (
            <SeekerPostCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}
