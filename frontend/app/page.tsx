'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { trackEvent } from '@/lib/analytics';

export default function HomePage() {
  return (
    <div className="space-y-12 sm:space-y-16">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
        <div className="space-y-6 rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(61,217,151,0.16),_transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-green/70">
            RentPilot Platform
          </p>
          <h1 className="font-sora text-4xl font-bold leading-tight sm:text-5xl">
            Rent smarter. Match better. Protect your rights.
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
            RentPilot is a renter-first ecosystem that helps you decode leases, avoid scams, get tenant-specific
            guidance, and connect with real people looking for roommates.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" onClick={() => trackEvent('home_cta_clicked', { cta: 'get_started' })}>
              <Button className="w-full sm:w-auto">Get started</Button>
            </Link>
            <Link href="/match" onClick={() => trackEvent('home_cta_clicked', { cta: 'explore_matches' })}>
              <Button variant="secondary" className="w-full sm:w-auto">Explore matches</Button>
            </Link>
          </div>
          <div className="grid gap-3 pt-1 sm:grid-cols-3">
            {[
              'Lease review in minutes',
              'Scam checks before you pay',
              'State-specific renter guidance',
            ].map((point) => (
              <div key={point} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
                {point}
              </div>
            ))}
          </div>
        </div>
        <Card className="space-y-5 border-brand-green/15 bg-brand-navy/80 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
              Launch bundle
            </p>
            <h2 className="mt-3 text-2xl font-semibold">Four tools. One renter hub.</h2>
          </div>
          <ul className="space-y-3 text-sm text-white/70">
            <li>📄 Lease Analyzer: AI review plus negotiation tips.</li>
            <li>🕵️ Scam Detector: listing risk and fee signals.</li>
            <li>⚖️ Tenant Rights Bot: grounded launch-state answers.</li>
            <li>🤝 Space & Seeker Matcher: renter-to-renter fit scoring.</li>
          </ul>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65">
            Start with the flow you need right now. RentPilot keeps the core renter jobs in one place instead of four separate tools.
          </div>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'Upload leases', text: 'See red flags and risky clauses in minutes.' },
          { title: 'Detect scams', text: 'Score listings with AI and see hidden fees.' },
          { title: 'Ask rights', text: 'Get state-specific tenant law answers.' },
          { title: 'Find roommates', text: 'Match with renters who fit your lifestyle.' },
        ].map((card) => (
          <Card key={card.title}>
            <h3 className="text-lg font-semibold">{card.title}</h3>
            <p className="mt-2 text-sm text-white/70">{card.text}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
