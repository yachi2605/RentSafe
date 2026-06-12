'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getMessages, sendMessage } from '@/lib/api';
import { Message } from '@/types';
import MessageThread from '@/components/MessageThread';

const POLL_INTERVAL_MS = 5000;

export default function MatchChatPage() {
  const params = useParams<{ matchId: string }>();
  const matchId = params.matchId;
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [me, setMe] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const response = await getMessages(matchId);
      setMessages(response.messages || []);
      setMe(response.me);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push('/login');
        return;
      }
      await load();
    };
    init();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const handleSend = async (content: string) => {
    try {
      await sendMessage(matchId, content);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Match chat</h1>
        <p className="text-sm text-white/60">
          Talk it through before you commit. Never send money to someone you have not met.
        </p>
      </div>
      {loading && <p className="text-sm text-white/60">Loading messages...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {!loading && <MessageThread messages={messages} onSend={handleSend} currentUserId={me} />}
    </div>
  );
}
