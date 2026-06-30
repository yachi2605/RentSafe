import ChatBot from '@/components/ChatBot';

export default function TenantRightsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-amber-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 sm:p-8">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300/80">
            Grounded legal guidance
          </p>
          <h1 className="font-sora text-3xl font-bold sm:text-4xl">Tenant Rights Bot</h1>
          <p className="text-sm leading-relaxed text-white/65">
            Ask renter questions and get source-backed answers for a small launch set of states. If RentPilot cannot ground the answer from its current registry, it will refuse instead of guessing.
          </p>
        </div>
      </section>

      <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
        RentPilot is an informational assistant, not a licensed attorney. Always verify the answer with a licensed attorney or a local tenant-rights organization before taking legal action.
      </div>
      <ChatBot />
    </div>
  );
}
