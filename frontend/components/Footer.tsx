import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-3">
          <p className="font-sora text-lg font-semibold text-white">RentPilot</p>
          <p className="max-w-xl text-sm leading-relaxed text-white/60">
            A renter-first platform for lease review, scam detection, grounded rights guidance, and roommate matching.
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">
            Launch rights coverage: California and Illinois
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Product
            </p>
            <div className="flex flex-col gap-2 text-sm text-white/65">
              <Link href="/lease-analyzer" className="hover:text-white">Lease Analyzer</Link>
              <Link href="/scam-checker" className="hover:text-white">Scam Detector</Link>
              <Link href="/tenant-rights" className="hover:text-white">Tenant Rights</Link>
              <Link href="/match" className="hover:text-white">Roommate Match</Link>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Guidance
            </p>
            <div className="flex flex-col gap-2 text-sm text-white/65">
              <Link href="/history/leases" className="hover:text-white">Lease history</Link>
              <Link href="/history/scams" className="hover:text-white">Scam history</Link>
              <Link href="/match/profile" className="hover:text-white">Match profile</Link>
              <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-6xl flex-col gap-2 border-t border-white/10 pt-6 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
        <p>RentPilot © 2026. Built for renters, by renters.</p>
        <p>Informational tools only. Verify lease and legal issues before acting.</p>
      </div>
    </footer>
  );
}
