'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface TosGateProps {
  onAccept: () => Promise<void>;
}

export default function TosGate({ onAccept }: TosGateProps) {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!agreed) return;
    setLoading(true);
    await onAccept();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="max-w-2xl rounded-2xl border border-white/10 bg-brand-navy p-8">
        <h2 className="mb-2 text-2xl font-semibold">Terms of Service</h2>
        <p className="mb-4 text-sm text-white/60">
          Please review and accept the Terms of Service to continue.
        </p>
        <div className="mb-6 h-64 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          <p className="mb-2 font-semibold text-white">RentSafe Terms of Service — Version 1.0</p>
          <p>
            RentSafe is a peer-to-peer renter platform. We do not participate in lease agreements and provide
            informational AI tools only. Please consult an attorney for legal advice.
          </p>
        </div>
        <label className="mb-6 flex items-start gap-3 text-sm text-white/70">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-green-500"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
          />
          I agree to the RentSafe Terms of Service.
        </label>
        <Button className="w-full" onClick={handleAccept} disabled={!agreed || loading}>
          {loading ? 'Saving...' : 'I Agree'}
        </Button>
      </div>
    </div>
  );
}
