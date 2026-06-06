'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getMyMatches } from '@/lib/api';
import { Match } from '@/types';
import MatchCard from '@/components/MatchCard';
import NotificationBell from '@/components/NotificationBell';

export default function DashboardPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setLoading(false);
        return;
      }
      const response = await getMyMatches(data.user.id);
      setMatches(response.matches || []);
      setLoading(false);
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
        {!loading && matches.length === 0 && (
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
