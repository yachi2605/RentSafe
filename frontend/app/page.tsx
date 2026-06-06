import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="grid gap-10 md:grid-cols-2">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.2em] text-white/60">RentSafe Platform</p>
          <h1 className="text-4xl font-bold font-sora leading-tight">
            Rent smarter. Match better. Protect your rights.
          </h1>
          <p className="text-white/70">
            RentSafe is a renter-first ecosystem that helps you decode leases, avoid scams, get tenant-specific
            guidance, and connect with real people looking for roommates.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/signup">
              <Button>Get started</Button>
            </Link>
            <Link href="/match">
              <Button variant="secondary">Explore matches</Button>
            </Link>
          </div>
        </div>
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold">Four tools. One renter hub.</h2>
          <ul className="space-y-3 text-sm text-white/70">
            <li>📄 Lease Analyzer — AI review + negotiation tips.</li>
            <li>🕵️ Scam Detector — Detect sketchy listings instantly.</li>
            <li>⚖️ Tenant Rights Bot — State-specific guidance.</li>
            <li>🤝 Space & Seeker Matcher — Real renter-to-renter matches.</li>
          </ul>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-4">
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
