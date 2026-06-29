'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getMessages, sendMessage } from '@/lib/api';
import { Message } from '@/types';
import { trackEvent } from '@/lib/analytics';
import MessageThread from '@/components/MessageThread';
import ReportButton from '@/components/ReportButton';
import SafetyNotice from '@/components/SafetyNotice';

const POLL_INTERVAL_MS = 5000;

export default function MatchChatPage() {
  const params = useParams<{ matchId: string }>();
  const matchId = params.matchId;
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [me, setMe] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
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
    setError(null);
    try {
      const response = await sendMessage(matchId, content);
      setNotice(response.moderation_notice || null);
      trackEvent('match_message_sent', {
        moderated: Boolean(response.moderation_notice),
        content_chars: content.trim().length,
      });
      await load();
      return true;
    } catch (err) {
      setNotice(null);
      trackEvent('match_message_failed');
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return false;
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Match chat</h1>
          <p className="text-sm text-white/60">
            Talk it through before you commit. Never send money to someone you have not met.
          </p>
        </div>
        <ReportButton
          label="Report conversation"
          subjectLabel="this conversation"
          targetId={matchId}
          targetType="match"
        />
      </div>
      <SafetyNotice title="Keep first conversations on RentPilot">
        Phone numbers, email addresses, and payment handles are removed from chat. Meet in a public place,
        verify the lease directly, and never send money because someone says the room will disappear today.
      </SafetyNotice>
      {loading && <p className="text-sm text-white/60">Loading messages...</p>}
      {notice && <p className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{notice}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {!loading && <MessageThread messages={messages} onSend={handleSend} currentUserId={me} />}
    </div>
  );
}
