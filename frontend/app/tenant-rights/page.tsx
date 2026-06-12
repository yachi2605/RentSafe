import ChatBot from '@/components/ChatBot';

export default function TenantRightsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Tenant Rights Bot</h1>
        <p className="text-sm text-white/60">Ask renter questions and get state-specific answers.</p>
      </div>
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 mb-6 text-sm text-yellow-200">
        ⚠️ RentSafe AI is an informational assistant, not a licensed attorney. Answers are retrieved
        from public tenant law data. Always verify with a licensed attorney or your local tenant
        advocacy organization before taking legal action.
      </div>
      <ChatBot />
    </div>
  );
}
