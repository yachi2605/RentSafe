'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AcceptTermsPage() {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  async function handleAccept() {
    if (!agreed) return;
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('profiles')
      .update({
        tos_accepted: true,
        tos_accepted_at: new Date().toISOString(),
        tos_version: '1.0',
      })
      .eq('id', user.id);
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#0F1B2D] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white/5 border border-white/10 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-2">Before you continue</h1>
        <p className="text-white/60 mb-6 text-sm">
          Please read and agree to our Terms of Service to use RentSafe.
        </p>

        <div className="h-72 overflow-y-auto bg-white/5 rounded-xl p-5 text-white/70 text-sm leading-relaxed space-y-4 mb-6 border border-white/10">
          <p className="text-white font-semibold text-base">RentSafe Terms of Service — Version 1.0</p>

          <p>
            <strong className="text-white">1. Platform Role</strong>
            <br />
            RentSafe is a peer-to-peer matchmaking and informational platform. We are not a party to any lease agreement,
            sublease arrangement, housing transaction, or roommate relationship. We do not own, manage, or control any
            property listed or discussed on this platform.
          </p>

          <p>
            <strong className="text-white">2. Your Lease Responsibility</strong>
            <br />
            You are solely responsible for reviewing your own lease agreement and complying with all terms set by your
            landlord. Adding a roommate, subletting, or co-signing a lease without your landlord&apos;s permission may violate
            your lease and could result in eviction or legal action. RentSafe is not responsible for any consequences
            arising from your housing decisions.
          </p>

          <p>
            <strong className="text-white">3. AI Tools Are Informational Only</strong>
            <br />
            The Lease Analyzer, Scam Detector, and Tenant Rights Bot provide AI-generated informational output only.
            Nothing on RentSafe constitutes legal advice. Always consult a licensed attorney for legal guidance specific
            to your situation.
          </p>

          <p>
            <strong className="text-white">4. No Verification of Users or Listings</strong>
            <br />
            RentSafe does not verify the identity of users, the accuracy of Space Posts or Seeker Posts, or the legitimacy
            of any housing arrangement. You interact with other users entirely at your own risk. Always meet in safe
            public places before agreeing to share housing with anyone.
          </p>

          <p>
            <strong className="text-white">5. No Liability</strong>
            <br />
            To the maximum extent permitted by law, RentSafe, its owners, employees, and affiliates are not liable for any
            damages, losses, disputes, injuries, or legal consequences arising from your use of this platform, including
            but not limited to eviction, lease violations, fraud by other users, or reliance on AI-generated content.
          </p>

          <p>
            <strong className="text-white">6. User Conduct</strong>
            <br />
            You agree not to post false, misleading, or fraudulent listings. You agree not to use RentSafe to harass,
            scam, or deceive other users. Violations may result in immediate account termination.
          </p>

          <p>
            <strong className="text-white">7. Governing Law</strong>
            <br />
            These Terms are governed by the laws of the State of Illinois, United States, without regard to conflict of
            law principles.
          </p>

          <p className="text-white/40 text-xs">
            Last updated: 2025. By clicking &quot;I Agree&quot;, you confirm you are at least 18 years old and agree to these Terms
            of Service.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer mb-6">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 accent-green-500 w-4 h-4"
          />
          <span className="text-white/70 text-sm">
            I have read and agree to the RentSafe Terms of Service. I understand that RentSafe is not liable for any
            housing decisions I make using this platform.
          </span>
        </label>

        <button
          onClick={handleAccept}
          disabled={!agreed || loading}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all
            bg-green-500 text-white hover:bg-green-400
            disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'I Agree — Continue to RentSafe'}
        </button>
      </div>
    </div>
  );
}
