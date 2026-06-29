'use client';

import { useEffect, useRef, useState } from 'react';
import LeaseUploader from '@/components/LeaseUploader';
import LeaseResultCard from '@/components/LeaseResultCard';
import {
  analyzeLease,
  getProactiveQA,
  askLeaseQuestionText,
  getMoveOutChecklist,
} from '@/lib/api';
import { LeaseAnalysisResult, ProactiveQAItem, MoveOutItem } from '@/types';
import { trackEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QAMessage {
  role: 'user' | 'bot';
  content: string;
}

const TIMING_ORDER = ['Before move-in', 'During tenancy', 'Day of move-out', 'After move-out'];

export default function LeaseAnalyzerPage() {
  const [result, setResult] = useState<LeaseAnalysisResult | null>(null);
  const [leaseText, setLeaseText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Proactive Q&A
  const [proactiveItems, setProactiveItems] = useState<ProactiveQAItem[]>([]);
  const [proactiveLoading, setProactiveLoading] = useState(false);
  const [openProactive, setOpenProactive] = useState<number | null>(null);

  // Manual Q&A chat
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Move-out checklist
  const [checklist, setChecklist] = useState<MoveOutItem[]>([]);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklistError, setChecklistError] = useState<string | null>(null);
  const [checklistDone, setChecklistDone] = useState<Set<number>>(new Set());

  // Active tab
  const [tab, setTab] = useState<'qa' | 'checklist'>('qa');

  const handleUpload = async (file: File) => {
    setLoading(true);
    setResult(null);
    setLeaseText('');
    setMessages([]);
    setProactiveItems([]);
    setChecklist([]);
    setError(null);

    try {
      trackEvent('lease_analysis_started', { file_type: file.type || 'application/pdf' });
      const response = await analyzeLease(file);
      setResult(response);
      const text = response.extracted_text || '';
      setLeaseText(text);
      trackEvent('lease_analysis_completed', {
        red_flag_count: response.red_flags?.length || 0,
        score: response.tenant_friendly_score,
      });

      // Auto-trigger proactive Q&A immediately after analysis
      if (text) {
        setProactiveLoading(true);
        try {
          const qa = await getProactiveQA(text);
          setProactiveItems(qa.items || []);
          setOpenProactive(0); // open first one by default
        } catch {
          // non-fatal — user can still ask manually
        } finally {
          setProactiveLoading(false);
        }
      }
    } catch (err) {
      trackEvent('lease_analysis_failed');
      setError(err instanceof Error ? err.message : 'Lease analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim() || !leaseText) return;
    const q = question.trim();
    setQuestion('');
    setQaError(null);
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setQaLoading(true);
    try {
      trackEvent('lease_question_submitted');
      const res = await askLeaseQuestionText(leaseText, q);
      setMessages((prev) => [...prev, { role: 'bot', content: res.answer }]);
      trackEvent('lease_question_answered');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      trackEvent('lease_question_failed');
      setQaError(err instanceof Error ? err.message : 'Failed to get answer');
    } finally {
      setQaLoading(false);
    }
  };

  const handleChecklist = async () => {
    if (!leaseText || checklistLoading) return;
    setChecklistLoading(true);
    setChecklistError(null);
    try {
      trackEvent('moveout_checklist_requested');
      const res = await getMoveOutChecklist(leaseText);
      setChecklist(res.items || []);
      trackEvent('moveout_checklist_completed', { item_count: res.items?.length || 0 });
    } catch (err) {
      trackEvent('moveout_checklist_failed');
      setChecklistError(err instanceof Error ? err.message : 'Failed to generate checklist');
    } finally {
      setChecklistLoading(false);
    }
  };

  const toggleChecked = (i: number) => {
    setChecklistDone((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  // Group checklist by timing
  const grouped = TIMING_ORDER.reduce<Record<string, (MoveOutItem & { idx: number })[]>>(
    (acc, timing) => {
      acc[timing] = checklist
        .map((item, idx) => ({ ...item, idx }))
        .filter((item) => item.timing === timing);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold sm:text-4xl">Lease Analyzer</h1>
        <p className="text-sm text-white/60">
          Upload your lease — get red flags, answers to key questions, and negotiation emails in seconds.
        </p>
      </div>

      <LeaseUploader onFileSelected={handleUpload} isLoading={loading} />
      {error && <p className="text-sm text-red-400">{error}</p>}

      {result && (
        <>
          <LeaseResultCard result={result} />

          {/* ── Proactive Q&A ── */}
          <section className="space-y-3 rounded-2xl border border-brand-green/20 bg-brand-green/5 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg">🔍</span>
              <h2 className="font-semibold">Key things we found in your lease</h2>
              {proactiveLoading && (
                <span className="text-sm text-white/40">Analyzing…</span>
              )}
            </div>

            {!proactiveLoading && proactiveItems.length === 0 && (
              <p className="text-sm text-white/50">Could not auto-generate questions for this document.</p>
            )}

            <div className="space-y-2">
              {proactiveItems.map((item, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                  <button
                    className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left"
                    onClick={() => setOpenProactive(openProactive === i ? null : i)}
                  >
                    <span className="text-sm font-medium">{item.question}</span>
                    <span className="shrink-0 text-white/40">{openProactive === i ? '▲' : '▼'}</span>
                  </button>
                  {openProactive === i && (
                    <div className="border-t border-white/10 px-4 py-3">
                      <p className="text-sm leading-relaxed text-white/75">{item.answer}</p>
                      {item.clause_ref && (
                        <p className="mt-1 text-xs text-brand-green/70">{item.clause_ref}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ── Tab switcher: Q&A chat | Move-out checklist ── */}
          {leaseText && (
            <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={() => setTab('qa')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    tab === 'qa'
                      ? 'bg-brand-green text-black'
                      : 'border border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  💬 Ask your lease
                </button>
                <button
                  onClick={() => { setTab('checklist'); if (!checklist.length) handleChecklist(); }}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    tab === 'checklist'
                      ? 'bg-brand-green text-black'
                      : 'border border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  ✅ Move-out protection
                </button>
              </div>

              {/* Q&A chat */}
              {tab === 'qa' && (
                <div className="space-y-4">
                  <p className="text-sm text-white/50">
                    Ask anything — answers come from your actual lease document.
                  </p>
                  <div className="max-h-80 space-y-3 overflow-y-auto">
                    {messages.length === 0 && (
                      <p className="text-sm text-white/30">
                        e.g. &ldquo;Can my landlord enter without notice?&rdquo; · &ldquo;What is the late fee?&rdquo; · &ldquo;How long is the notice period?&rdquo;
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
                        Reading your lease…
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>
                  {qaError && <p className="text-sm text-red-400">{qaError}</p>}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      placeholder="Ask about your lease…"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !qaLoading) handleAsk(); }}
                      disabled={qaLoading}
                      className="flex-1"
                    />
                    <Button onClick={handleAsk} disabled={qaLoading || !question.trim()} className="w-full sm:w-auto">
                      {qaLoading ? '…' : 'Ask'}
                    </Button>
                  </div>
                  <p className="text-xs text-white/25">AI answers based on your lease only — not legal advice.</p>
                </div>
              )}

              {/* Move-out checklist */}
              {tab === 'checklist' && (
                <div className="space-y-4">
                  {checklistLoading && (
                    <p className="text-sm text-white/50">Building your checklist from the lease…</p>
                  )}
                  {checklistError && <p className="text-sm text-red-400">{checklistError}</p>}

                  {!checklistLoading && checklist.length > 0 && (
                    <>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-white/50">
                          {checklistDone.size}/{checklist.length} tasks complete
                        </p>
                        <div className="h-1.5 w-32 rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-brand-green transition-all"
                            style={{ width: `${(checklistDone.size / checklist.length) * 100}%` }}
                          />
                        </div>
                      </div>

                      {TIMING_ORDER.map((timing) => {
                        const items = grouped[timing];
                        if (!items?.length) return null;
                        return (
                          <div key={timing}>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                              {timing}
                            </p>
                            <div className="space-y-2">
                              {items.map((item) => (
                                <button
                                  key={item.idx}
                                  onClick={() => toggleChecked(item.idx)}
                                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                                    checklistDone.has(item.idx)
                                      ? 'border-brand-green/20 bg-brand-green/5 opacity-60'
                                      : 'border-white/10 bg-white/5 hover:border-white/20'
                                  }`}
                                >
                                  <span className={`mt-0.5 shrink-0 text-lg leading-none ${checklistDone.has(item.idx) ? 'text-brand-green' : 'text-white/20'}`}>
                                    {checklistDone.has(item.idx) ? '✓' : '○'}
                                  </span>
                                  <div>
                                    <p className={`text-sm font-medium ${checklistDone.has(item.idx) ? 'line-through text-white/40' : ''}`}>
                                      {item.task}
                                    </p>
                                    <p className="mt-0.5 text-xs text-white/50">{item.reason}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
