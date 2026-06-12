'use client';

import { useState } from 'react';
import { Message } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MessageThreadProps {
  messages: Message[];
  onSend: (content: string) => Promise<void>;
  currentUserId?: string;
}

export default function MessageThread({ messages, onSend, currentUserId }: MessageThreadProps) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!draft.trim()) return;
    setSending(true);
    await onSend(draft);
    setDraft('');
    setSending(false);
  };

  return (
    <div className="space-y-4">
      <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-4">
        {messages.length === 0 && (
          <p className="text-sm text-white/60">No messages yet. Say hello!</p>
        )}
        {messages.map((message) => {
          const mine = currentUserId && message.sender_id === currentUserId;
          return (
            <div
              key={message.id}
              className={`max-w-[80%] rounded-lg p-2 text-sm ${
                mine
                  ? 'ml-auto bg-brand-green/20 text-white'
                  : 'bg-white/10 text-white/80'
              }`}
            >
              {message.content}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Type a message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button onClick={handleSend} disabled={sending}>
          {sending ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  );
}
