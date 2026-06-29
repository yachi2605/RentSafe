'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const TERMS_SUMMARY = [
  {
    title: 'RentPilot is not your landlord',
    text: 'It helps you assess housing decisions, but it is not a party to your lease, room agreement, or payment arrangement.',
  },
  {
    title: 'AI output is informational',
    text: 'Lease, scam, and rights answers can help you think clearly, but they do not replace legal review or lease verification.',
  },
  {
    title: 'You still verify people and listings',
    text: 'Meet safely, verify the lease directly, and never send money before you confirm the situation yourself.',
  },
];

export default function AcceptTermsPage() {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  async function handleAccept() {
    if (!agreed) return;
    setLoading(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError('Your session expired. Please sign in again.');
      setLoading(false);
      router.push('/login');
      return;
    }

    const { error: upsertError } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        email: user.email ?? null,
        tos_accepted: true,
        tos_accepted_at: new Date().toISOString(),
        tos_version: '1.0',
      },
      { onConflict: 'id' }
    );

    if (upsertError) {
      setError(upsertError.message);
      setLoading(false);
      return;
    }

    router.refresh();
    router.push('/dashboard');
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0F1B2D] px-4 py-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          <Card className="border-amber-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.16),_transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300/80">
              Before you continue
            </p>
            <h1 className="mt-3 font-sora text-3xl font-bold text-white">Accept the launch terms</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              RentPilot gives you safer renter tools, but it does not replace legal advice, lease review by counsel, or your own verification of listings and roommates.
            </p>
          </Card>

          {TERMS_SUMMARY.map((item) => (
            <Card key={item.title} className="border-white/10 bg-white/[0.04] p-5">
              <p className="font-semibold text-white">{item.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{item.text}</p>
            </Card>
          ))}
        </div>

        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-white">Terms of Service</h2>
          <p className="mb-6 mt-2 text-sm text-white/60">
            Read the terms below, then confirm that you understand RentPilot&apos;s role and your responsibilities.
          </p>

          <div className="mb-6 h-72 space-y-4 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-5 text-sm leading-relaxed text-white/70">
            <p className="text-base font-semibold text-white">RentPilot Terms of Service — Version 1.0</p>

            <p>
              <strong className="text-white">1. Platform Role</strong>
              <br />
              RentPilot is a peer-to-peer matchmaking and informational platform. We are not a party to any lease agreement,
              sublease arrangement, housing transaction, or roommate relationship. We do not own, manage, or control any
              property listed or discussed on this platform.
            </p>

            <p>
              <strong className="text-white">2. Your Lease Responsibility</strong>
              <br />
              You are solely responsible for reviewing your own lease agreement and complying with all terms set by your
              landlord. Adding a roommate, subletting, or co-signing a lease without your landlord&apos;s permission may violate
              your lease and could result in eviction or legal action. RentPilot is not responsible for any consequences
              arising from your housing decisions.
            </p>

            <p>
              <strong className="text-white">3. AI Tools Are Informational Only</strong>
              <br />
              The Lease Analyzer, Scam Detector, and Tenant Rights Bot provide AI-generated informational output only.
              Nothing on RentPilot constitutes legal advice. Always consult a licensed attorney for legal guidance specific
              to your situation.
            </p>

            <p>
              <strong className="text-white">4. No Verification of Users or Listings</strong>
              <br />
              RentPilot does not verify the identity of users, the accuracy of Space Posts or Seeker Posts, or the legitimacy
              of any housing arrangement. You interact with other users entirely at your own risk. Always meet in safe
              public places before agreeing to share housing with anyone.
            </p>

            <p>
              <strong className="text-white">5. No Liability</strong>
              <br />
              To the maximum extent permitted by law, RentPilot, its owners, employees, and affiliates are not liable for any
              damages, losses, disputes, injuries, or legal consequences arising from your use of this platform, including
              but not limited to eviction, lease violations, fraud by other users, or reliance on AI-generated content.
            </p>

            <p>
              <strong className="text-white">6. User Conduct</strong>
              <br />
              You agree not to post false, misleading, or fraudulent listings. You agree not to use RentPilot to harass,
              scam, or deceive other users. Violations may result in immediate account termination.
            </p>

            <p>
              <strong className="text-white">7. Governing Law</strong>
              <br />
              These Terms are governed by the laws of the State of Illinois, United States, without regard to conflict of
              law principles.
            </p>

            <p className="text-xs text-white/40">
              Version 1.0. By clicking &quot;I Agree&quot;, you confirm you are at least 18 years old and agree to these Terms of Service.
            </p>
          </div>

          <label className="mb-6 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 accent-green-500"
            />
            <span className="text-sm text-white/70">
              I have read and agree to the RentPilot Terms of Service. I understand that RentPilot is not liable for any
              housing decisions I make using this platform.
            </span>
          </label>

          <Button onClick={handleAccept} disabled={!agreed || loading} className="w-full">
            {loading ? 'Saving...' : 'I Agree — Continue to RentPilot'}
          </Button>
          {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
        </div>
      </div>
    </div>
  );
}
