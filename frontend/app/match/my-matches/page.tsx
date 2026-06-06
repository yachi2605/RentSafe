'use client';

import { useEffect, useState } from 'react';
import { getMyMatches } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Match } from '@/types';
import MatchCard from '@/components/MatchCard';

export default function MyMatchesPage() {
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
      <h1 className="text-3xl font-semibold">Your matches</h1>
      {loading && <p className="text-sm text-white/60">Loading matches...</p>}
      {!loading && matches.length === 0 && (
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
