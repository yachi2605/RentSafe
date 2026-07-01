'use client';

import { useEffect, useState } from 'react';
import { FileText, ShieldAlert, Scale, Users, ChevronDown, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

// ─── Scenario definitions ────────────────────────────────────────────────────

const SCENARIOS = [
  {
    tool: 'Lease Analyzer',
    Icon: FileText,
    accent: '#3dd997',
    input: '"Month-to-month lease, $2,800/mo, no subletting, landlord may enter with 12-hr notice."',
    steps: [
      { id: 'upload', label: 'PDF uploaded', sub: '14-page lease · 2.1 MB', type: 'node' },
      { id: 'extract', label: 'Text extracted', sub: 'OpenAI Whisper · 1,840 tokens', type: 'node' },
      { id: 'analyze', label: 'AI clause scan', sub: 'GPT-4o · 23 clauses', type: 'node' },
      { id: 'split', label: 'Red flag threshold ≥ 3?', sub: 'Splitter block', type: 'splitter', trueLabel: 'Flag review', falseLabel: 'Tenant-safe' },
    ],
    result: { label: '⚠ 5 red flags found', tone: 'amber', score: '6.2 / 10' },
  },
  {
    tool: 'Scam Detector',
    Icon: ShieldAlert,
    accent: '#fbbf24',
    input: '"2BR near campus, $800/mo all-in. Owner overseas. Wire $1,200 deposit to hold it."',
    steps: [
      { id: 'paste', label: 'Listing text received', sub: '342 characters · Craigslist', type: 'node' },
      { id: 'signals', label: 'Signal extraction', sub: '9 risk indicators found', type: 'node' },
      { id: 'score', label: 'Scam model', sub: 'p = 0.91', type: 'ml' },
      { id: 'split', label: 'Scam score ≥ 0.75?', sub: 'Splitter block', type: 'splitter', trueLabel: 'Alert renter', falseLabel: 'Low risk' },
    ],
    result: { label: '🚨 High scam probability', tone: 'red', score: '91 / 100' },
  },
  {
    tool: 'Tenant Rights',
    Icon: Scale,
    accent: '#7dd3fc',
    input: '"My landlord raised my rent by 22% in Chicago with 30 days notice. Is this legal?"',
    steps: [
      { id: 'query', label: 'Question received', sub: 'State: Illinois · Chicago', type: 'node' },
      { id: 'lookup', label: 'Law retrieval', sub: 'RLTO § 5-12-130 matched', type: 'node' },
      { id: 'ground', label: 'Grounded response', sub: 'GPT-4o + verified source', type: 'node' },
      { id: 'split', label: 'Violation detected?', sub: 'Splitter block', type: 'splitter', trueLabel: 'Cite violation', falseLabel: 'Explain law' },
    ],
    result: { label: '✓ Violation confirmed', tone: 'green', score: '90-day notice required' },
  },
  {
    tool: 'Roommate Match',
    Icon: Users,
    accent: '#c4b5fd',
    input: '"Looking for a quiet roommate in Wicker Park, budget $1,100, furnished, no pets."',
    steps: [
      { id: 'profile', label: 'Seeker profile parsed', sub: '6 preference signals', type: 'node' },
      { id: 'embed', label: 'Embedding match', sub: 'Cosine similarity · 47 spaces', type: 'node' },
      { id: 'score', label: 'Compatibility score', sub: 'p = 0.88 top match', type: 'ml' },
      { id: 'split', label: 'Match score ≥ 0.80?', sub: 'Splitter block', type: 'splitter', trueLabel: 'Surface match', falseLabel: 'Widen search' },
    ],
    result: { label: '✓ 3 strong matches', tone: 'green', score: '88% fit' },
  },
];

const STEP_DURATION = 700; // ms per step
const SCENARIO_PAUSE = 2200; // ms to hold on result before cycling

// ─── Component ───────────────────────────────────────────────────────────────

export default function HowItWorks() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [activeStep, setActiveStep] = useState(-1);
  const [showResult, setShowResult] = useState(false);

  const scenario = SCENARIOS[scenarioIdx];

  // Animate steps in sequence, then show result, then cycle scenario
  useEffect(() => {
    setActiveStep(-1);
    setShowResult(false);

    let step = 0;
    const interval = setInterval(() => {
      if (step < scenario.steps.length) {
        setActiveStep(step);
        step++;
      } else {
        clearInterval(interval);
        setShowResult(true);
        setTimeout(() => {
          setScenarioIdx((i) => (i + 1) % SCENARIOS.length);
        }, SCENARIO_PAUSE);
      }
    }, STEP_DURATION);

    return () => clearInterval(interval);
  }, [scenarioIdx, scenario.steps.length]);

  const toneClass = {
    green: 'border-brand-green/40 bg-brand-green/10 text-brand-green',
    amber: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
    red: 'border-red-400/40 bg-red-400/10 text-red-300',
  }[scenario.result.tone];

  return (
    <section className="space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-green/70">How it works</p>
        <h2 className="font-sora text-3xl font-bold sm:text-4xl">Watch the pipeline live</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-white/60">
          Every tool runs the same flow: parse your input, extract signals, run the AI model, branch on the result. Here&apos;s each one in real time.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((s, i) => (
          <button
            key={s.tool}
            onClick={() => setScenarioIdx(i)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
              i === scenarioIdx
                ? 'border-white/20 bg-white/[0.08] text-white'
                : 'border-white/10 bg-transparent text-white/45 hover:text-white/70'
            }`}
          >
            <s.Icon size={14} strokeWidth={2} />
            {s.tool}
          </button>
        ))}
      </div>

      {/* Pipeline card */}
      <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 sm:p-8">
        {/* Live badge + tool name */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
              style={{ borderColor: `${scenario.accent}40`, color: scenario.accent, background: `${scenario.accent}12` }}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                  style={{ background: scenario.accent }}
                />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: scenario.accent }} />
              </span>
              Live
            </span>
            <span className="font-sora text-base font-semibold text-white">{scenario.tool} Decision Flow</span>
          </div>
          <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/40 sm:inline">
            Version 2.0
          </span>
        </div>

        {/* Input chip */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Input</p>
          <p className="text-sm leading-relaxed text-white/70 italic">{scenario.input}</p>
        </div>

        {/* Flow nodes */}
        <div className="relative space-y-1">
          {scenario.steps.map((step, i) => {
            const isActive = i <= activeStep;
            const isCurrent = i === activeStep;

            if (step.type === 'splitter') {
              return (
                <div key={step.id}>
                  {/* Connector */}
                  <div className="flex justify-center py-1">
                    <div className={`h-5 w-px transition-colors duration-500 ${isActive ? 'bg-white/30' : 'bg-white/10'}`} />
                  </div>
                  {/* Splitter node */}
                  <div className={`relative mx-auto max-w-sm rounded-2xl border p-3 text-center transition-all duration-500 ${
                    isActive
                      ? 'border-white/20 bg-white/[0.06]'
                      : 'border-white/8 bg-white/[0.02] opacity-40'
                  } ${isCurrent ? 'shadow-[0_0_20px_rgba(255,255,255,0.05)]' : ''}`}>
                    <div className="flex items-center justify-center gap-2">
                      <ChevronDown size={14} className="text-white/40" />
                      <span className="text-sm font-medium text-white/80">{step.label}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-white/35">{step.sub}</p>
                  </div>
                  {/* True / False branches — show after animation completes */}
                  {isActive && showResult && (
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <div className={`rounded-xl border p-3 text-center ${toneClass}`}>
                        <p className="text-xs font-semibold">{step.trueLabel}</p>
                        <p className="mt-0.5 text-[10px] opacity-60">True branch</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center opacity-30">
                        <p className="text-xs font-semibold text-white/60">{step.falseLabel}</p>
                        <p className="mt-0.5 text-[10px] text-white/30">False branch</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={step.id}>
                {i > 0 && (
                  <div className="flex justify-center py-1">
                    <div className={`h-5 w-px transition-colors duration-500 ${isActive ? 'bg-white/30' : 'bg-white/10'}`} />
                  </div>
                )}
                <div className={`rounded-2xl border px-4 py-3 transition-all duration-500 ${
                  isActive
                    ? 'border-white/15 bg-white/[0.05]'
                    : 'border-white/8 bg-white/[0.02] opacity-40'
                } ${isCurrent ? 'shadow-[0_0_24px_rgba(255,255,255,0.04)]' : ''}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {/* Icon changes based on step type */}
                      {step.type === 'ml' ? (
                        <span className={`rounded-lg border border-white/10 bg-white/[0.06] px-2 py-1 font-mono text-xs font-bold transition-colors ${isActive ? '' : 'opacity-30'}`}
                          style={{ color: isActive ? scenario.accent : undefined }}>
                          ML
                        </span>
                      ) : (
                        <span className={`h-2 w-2 rounded-full transition-colors duration-300 ${isActive ? 'bg-white/50' : 'bg-white/15'}`} />
                      )}
                      <div>
                        <p className={`text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-white/40'}`}>
                          {step.label}
                        </p>
                        {step.type === 'ml' && (
                          <p className="text-xs font-semibold" style={{ color: scenario.accent }}>{step.sub}</p>
                        )}
                      </div>
                    </div>
                    {step.type !== 'ml' && (
                      <p className={`text-xs transition-colors ${isActive ? 'text-white/35' : 'text-white/15'}`}>{step.sub}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Final result */}
        <div className={`mt-4 overflow-hidden transition-all duration-500 ${showResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          <div className={`flex items-center justify-between rounded-2xl border p-4 ${toneClass}`}>
            <div className="flex items-center gap-3">
              {scenario.result.tone === 'green' && <CheckCircle2 size={18} strokeWidth={2} />}
              {scenario.result.tone === 'amber' && <AlertTriangle size={18} strokeWidth={2} />}
              {scenario.result.tone === 'red' && <XCircle size={18} strokeWidth={2} />}
              <span className="font-semibold">{scenario.result.label}</span>
            </div>
            <span className="rounded-full border border-current/30 bg-current/10 px-3 py-1 text-xs font-bold opacity-80">
              {scenario.result.score}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
