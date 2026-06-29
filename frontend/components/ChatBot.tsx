'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { askTenantRights, getTenantRightsCoverage } from '@/lib/api';
import { RightsAnswer, RightsCoverage } from '@/types';
import { trackEvent } from '@/lib/analytics';
import { US_STATES } from '@/lib/rental-options';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface RightsTurn {
  id: string;
  question: string;
  result: RightsAnswer;
  feedback?: 'helpful' | 'not_helpful';
}

const FALLBACK_COVERAGE: RightsCoverage = {
  states: [...US_STATES],
  supported_states: ['California', 'Illinois'],
  coverage_topics: [
    'Security deposits',
    'Repairs and habitability',
    'Landlord entry and privacy',
    'Eviction process basics',
  ],
  coverage_message:
    'Launch coverage currently supports California and Illinois with the strongest answers on deposits, repairs, entry, and eviction basics.',
};

function sourceLabel(topic: string) {
  return topic.replaceAll('_', ' ');
}

export default function ChatBot() {
  const [coverage, setCoverage] = useState<RightsCoverage>(FALLBACK_COVERAGE);
  const [turns, setTurns] = useState<RightsTurn[]>([]);
  const [question, setQuestion] = useState('');
  const [state, setState] = useState('Illinois');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadCoverage = async () => {
      try {
        const response = await getTenantRightsCoverage();
        if (active) {
          setCoverage(response);
        }
      } catch {
        // Fall back to the local launch metadata if the coverage request fails.
      }
    };

    loadCoverage();
    return () => {
      active = false;
    };
  }, []);

  const supported = coverage.supported_states.includes(state);

  const sendQuestion = async () => {
    const trimmed = question.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      trackEvent('rights_question_submitted', { state, supported_state: supported });
      const result = await askTenantRights(trimmed, state);
      setTurns((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${prev.length}`,
          question: trimmed,
          result,
        },
      ]);
      trackEvent('rights_question_completed', {
        state,
        refused: result.refused,
        source_count: result.sources.length,
      });
      setQuestion('');
    } catch (err) {
      trackEvent('rights_question_failed', { state });
      setError(err instanceof Error ? err.message : 'Sorry, something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setFeedback = (turnId: string, feedback: 'helpful' | 'not_helpful') => {
    setTurns((prev) =>
      prev.map((turn) => (turn.id === turnId ? { ...turn, feedback } : turn)),
    );
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-5 border-sky-400/20 bg-sky-400/5 p-5 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300/80">
              Launch coverage
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{coverage.coverage_message}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {coverage.supported_states.map((supportedState) => (
              <Badge
                key={supportedState}
                tone={supportedState === state ? 'green' : 'neutral'}
              >
                {supportedState}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {coverage.coverage_topics.map((topic) => (
            <span
              key={topic}
              className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs text-white/70"
            >
              {topic}
            </span>
          ))}
        </div>
      </Card>

      <Card className="space-y-4 p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              State
            </label>
            <Select value={state} onChange={(event) => setState(event.target.value)}>
              {coverage.states.map((name) => (
                <option key={name} value={name} className="text-black">
                  {name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Question
            </label>
            <Textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about deposits, repairs, landlord entry, or eviction basics..."
              className="min-h-[110px]"
            />
          </div>
        </div>

        {!supported && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100/85">
            {state} is outside the current grounded launch coverage. You can still ask, but the bot will refuse and point you toward local help instead of guessing.
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100/85">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button onClick={sendQuestion} disabled={loading || !question.trim()} className="w-full sm:w-auto">
            {loading ? 'Checking sources...' : 'Ask RentPilot'}
          </Button>
          <Link href="/match/profile" className="text-sm text-white/55 hover:text-white/80">
            Need roommate help instead? Open your match profile →
          </Link>
        </div>
      </Card>

      <div className="space-y-4">
        {turns.length === 0 && (
          <Card className="border-dashed bg-white/[0.03]">
            <p className="text-sm text-white/60">
              Start with a focused question like “How long does my landlord have to return my deposit?” or “Can my landlord enter without notice?”
            </p>
          </Card>
        )}

        {turns.map((turn) => (
          <Card key={turn.id} className="space-y-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Your question
                </p>
                <h3 className="text-lg font-semibold text-white">{turn.question}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone={turn.result.refused ? 'amber' : 'green'}>{turn.result.state}</Badge>
                <Badge tone={turn.result.supported_state ? 'green' : 'neutral'}>
                  {turn.result.supported_state ? 'Launch state' : 'Outside launch coverage'}
                </Badge>
              </div>
            </div>

            <div className={`rounded-2xl border p-5 text-sm leading-relaxed ${
              turn.result.refused
                ? 'border-amber-400/20 bg-amber-400/5 text-amber-100/90'
                : 'border-brand-green/20 bg-brand-green/5 text-white/85'
            }`}>
              {turn.result.answer}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Sources
                </p>
                {turn.result.sources.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-4 text-sm text-white/55">
                    No source cards are shown because this response was a coverage refusal.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {turn.result.sources.map((source) => (
                      <a
                        key={`${turn.id}-${source.url}`}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-brand-green/35 hover:bg-white/[0.05]"
                      >
                        <p className="text-sm font-semibold text-white">{source.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/45">
                          {source.organization}
                        </p>
                        <p className="mt-3 text-xs text-brand-green/80">{sourceLabel(source.topic)}</p>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Safety note
                </p>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/65">
                  <p>{turn.result.disclaimer}</p>
                  <p className="mt-3">{turn.result.coverage_message}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                    Was this helpful?
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant={turn.feedback === 'helpful' ? 'primary' : 'secondary'}
                      onClick={() => setFeedback(turn.id, 'helpful')}
                    >
                      Helpful
                    </Button>
                    <Button
                      variant={turn.feedback === 'not_helpful' ? 'primary' : 'secondary'}
                      onClick={() => setFeedback(turn.id, 'not_helpful')}
                    >
                      Not helpful
                    </Button>
                  </div>
                  {turn.feedback && (
                    <p className="mt-3 text-sm text-white/55">
                      Thanks. This will help shape the next rights-bot pass.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
