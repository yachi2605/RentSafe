import ChatBot from '@/components/ChatBot';

export default function TenantRightsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Tenant Rights Bot</h1>
        <p className="text-sm text-white/60">Ask renter questions and get state-specific answers.</p>
      </div>
      <ChatBot />
    </div>
  );
}
