'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getMyMatches } from '@/lib/api';
import { Match } from '@/types';
import MatchCard from '@/components/MatchCard';
import NotificationBell from '@/components/NotificationBell';

export default function DashboardPage() {
  const supabase = createClientComponentClient();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!data.user) {
          setLoading(false);
          return;
        }
        const response = await getMyMatches(data.user.id);
        setMatches(response.matches || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load matches');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Your dashboard</h1>
          <p className="text-sm text-white/60">Track matches, posts, and recent activity.</p>
        </div>
        <NotificationBell count={matches.length} />
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Your matches</h2>
        {loading && <p className="text-sm text-white/60">Loading matches...</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!loading && !error && matches.length === 0 && (
          <p className="text-sm text-white/60">No matches yet. Create a space or seeker post to get started.</p>
        )}
        <div className="grid gap-4">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </section>
    </div>
  );
}
