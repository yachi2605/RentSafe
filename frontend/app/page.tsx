'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { trackEvent } from '@/lib/analytics';
import { FileText, ShieldAlert, Scale, Users, ArrowRight } from 'lucide-react';
import HowItWorks from '@/components/HowItWorks';

export default function HomePage() {
  return (
    <div className="space-y-12 sm:space-y-16">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
        <div className="space-y-6 rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(61,217,151,0.16),_transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 sm:p-8">
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
            {[
              { Icon: FileText, color: 'text-brand-green', label: 'Lease Analyzer', desc: 'AI review plus negotiation tips.' },
              { Icon: ShieldAlert, color: 'text-amber-300', label: 'Scam Detector', desc: 'Listing risk and fee signals.' },
              { Icon: Scale, color: 'text-sky-300', label: 'Tenant Rights Bot', desc: 'Grounded state-specific answers.' },
              { Icon: Users, color: 'text-violet-300', label: 'Space & Seeker Matcher', desc: 'Renter-to-renter fit scoring.' },
            ].map(({ Icon, color, label, desc }) => (
              <li key={label} className="flex items-center gap-3">
                <span className={`rounded-lg border border-white/10 bg-white/[0.06] p-1.5 ${color}`}>
                  <Icon size={14} strokeWidth={2} />
                </span>
                <span><span className="font-medium text-white/85">{label}:</span> {desc}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65">
            Start with the flow you need right now. RentPilot keeps the core renter jobs in one place instead of four separate tools.
          </div>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { Icon: FileText, color: 'text-brand-green', bg: 'bg-brand-green/10 border-brand-green/20', title: 'Upload leases', text: 'See red flags and risky clauses in minutes.', href: '/lease-analyzer' },
          { Icon: ShieldAlert, color: 'text-amber-300', bg: 'bg-amber-300/10 border-amber-300/20', title: 'Detect scams', text: 'Score listings with AI and see hidden fees.', href: '/scam-checker' },
          { Icon: Scale, color: 'text-sky-300', bg: 'bg-sky-300/10 border-sky-300/20', title: 'Ask rights', text: 'Get state-specific tenant law answers.', href: '/tenant-rights' },
          { Icon: Users, color: 'text-violet-300', bg: 'bg-violet-300/10 border-violet-300/20', title: 'Find roommates', text: 'Match with renters who fit your lifestyle.', href: '/match' },
        ].map(({ Icon, color, bg, title, text, href }) => (
          <Link
            key={title}
            href={href}
            onClick={() => trackEvent('home_tool_card_clicked', { tool: title })}
            className="group"
          >
            <Card className="h-full space-y-3 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07]">
              <span className={`inline-flex rounded-xl border p-2.5 ${bg} ${color}`}>
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="text-sm text-white/60">{text}</p>
              <p className="flex items-center gap-1 text-xs font-medium text-white/25 transition group-hover:text-white/50">
                Try it <ArrowRight size={12} />
              </p>
            </Card>
          </Link>
        ))}
      </section>

      {/* How It Works — animated pipeline */}
      <HowItWorks />

      {/* Closing CTA */}
      <section className="rounded-[28px] border border-brand-green/20 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(61,217,151,0.14),_transparent_55%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-8 sm:p-12">
        <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <h2 className="font-sora text-3xl font-bold leading-tight sm:text-4xl">
              Your next lease could be<br className="hidden sm:block" /> the safest one yet.
            </h2>
            <p className="max-w-lg text-sm leading-relaxed text-white/60">
              Join renters who catch red flags before signing, spot scams before paying, and find roommates who actually fit — all in one place.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-shrink-0">
            <Link href="/signup" onClick={() => trackEvent('home_cta_clicked', { cta: 'closing_get_started' })}>
              <Button className="w-full sm:w-auto">
                Get started free <ArrowRight size={14} />
              </Button>
            </Link>
            <Link href="/lease-analyzer" onClick={() => trackEvent('home_cta_clicked', { cta: 'closing_analyze_lease' })}>
              <Button variant="secondary" className="w-full sm:w-auto">Analyze a lease first</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
