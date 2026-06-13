'use client';

import { useRef, useState } from 'react';
import LeaseUploader from '@/components/LeaseUploader';
import LeaseResultCard from '@/components/LeaseResultCard';
import { analyzeLease, askLeaseQuestion } from '@/lib/api';
import { LeaseAnalysisResult } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QAMessage {
  role: 'user' | 'bot';
  content: string;
}

export default function LeaseAnalyzerPage() {
  const [result, setResult] = useState<LeaseAnalysisResult | null>(null);
  const [leaseFile, setLeaseFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Q&A state
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleUpload = async (file: File) => {
    setLoading(true);
    setResult(null);
    setLeaseFile(file);
    setMessages([]);
    setError(null);
    try {
      const response = await analyzeLease(file);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lease analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim() || !leaseFile) return;
    const q = question.trim();
    setQuestion('');
    setQaError(null);
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setQaLoading(true);
    try {
      const res = await askLeaseQuestion(leaseFile, q);
      setMessages((prev) => [...prev, { role: 'bot', content: res.answer }]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      setQaError(err instanceof Error ? err.message : 'Failed to get answer');
    } finally {
      setQaLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !qaLoading) handleAsk();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Lease Analyzer</h1>
        <p className="text-sm text-white/60">Upload a lease PDF and get a renter-friendly breakdown.</p>
      </div>
      <LeaseUploader onFileSelected={handleUpload} isLoading={loading} />
      {error && <p className="text-sm text-red-400">{error}</p>}
      {result && <LeaseResultCard result={result} />}

      {/* Q&A section — only shown after a lease is analyzed */}
      {result && leaseFile && (
        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div>
            <h2 className="text-lg font-semibold">Ask about your lease</h2>
            <p className="text-sm text-white/50">
              Ask anything — the AI answers based only on your document.
            </p>
          </div>

          {/* Message thread */}
          <div className="max-h-80 space-y-3 overflow-y-auto">
            {messages.length === 0 && (
              <p className="text-sm text-white/40">
                e.g. &ldquo;Can my landlord enter without notice?&rdquo; or &ldquo;What&apos;s the early termination penalty?&rdquo;
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'ml-8 bg-brand-green/20 text-white'
                    : 'mr-8 bg-white/10 text-white/80'
                }`}
              >
                {msg.content}
              </div>
            ))}
            {qaLoading && (
              <div className="mr-8 rounded-xl bg-white/10 px-4 py-3 text-sm text-white/40">
                Thinking…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {qaError && <p className="text-sm text-red-400">{qaError}</p>}

          {/* Input row */}
          <div className="flex gap-2">
            <Input
              placeholder="Ask a question about your lease…"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={qaLoading}
              className="flex-1"
            />
            <Button onClick={handleAsk} disabled={qaLoading || !question.trim()}>
              {qaLoading ? '…' : 'Ask'}
            </Button>
          </div>

          <p className="text-xs text-white/30">
            AI answers are based on your lease text only — not legal advice.
          </p>
        </section>
      )}
    </div>
  );
}
