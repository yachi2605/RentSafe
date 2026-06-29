'use client';

import { useEffect, useState } from 'react';
import { getMyMatches } from '@/lib/api';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Match } from '@/types';
import MatchCard from '@/components/MatchCard';

export default function MyMatchesPage() {
  const [supabase] = useState(() => createClientComponentClient());
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
  }, [supabase]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Your matches</h1>
      {loading && <p className="text-sm text-white/60">Loading matches...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {!loading && !error && matches.length === 0 && (
        <p className="text-sm text-white/60">No matches yet.</p>
      )}
      <div className="grid gap-4">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}
