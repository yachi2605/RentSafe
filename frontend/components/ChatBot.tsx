'use client';

import { useState } from 'react';
import { askTenantRights } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
}

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
];

export default function ChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [state, setState] = useState('CA');
  const [loading, setLoading] = useState(false);

  const sendQuestion = async () => {
    if (!question.trim()) return;
    setLoading(true);
    const userMessage: ChatMessage = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');

    try {
      const response = await askTenantRights(userMessage.content, state);
      setMessages((prev) => [...prev, { role: 'bot', content: response.answer }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={state} onChange={(event) => setState(event.target.value)}>
          {STATES.map((code) => (
            <option key={code} value={code} className="text-black">
              {code}
            </option>
          ))}
        </Select>
        <Input
          placeholder="Ask a tenant rights question..."
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <Button onClick={sendQuestion} disabled={loading}>
          {loading ? 'Thinking...' : 'Ask'}
        </Button>
      </div>
      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        {messages.length === 0 && (
          <p className="text-sm text-white/60">Start by asking a question about tenant rights.</p>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`rounded-xl p-3 text-sm ${
              message.role === 'user'
                ? 'bg-brand-green/20 text-white'
                : 'bg-white/10 text-white/80'
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>
    </div>
  );
}
