'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { trackEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const SIGNUP_BENEFITS = [
  {
    title: 'Save results permanently',
    text: 'Lease analyses and scam checks you run stay in your account forever — not just for 7 days on one device.',
  },
  {
    title: 'Access from anywhere',
    text: 'Pick up past analyses on your phone, laptop, or library computer. No re-uploading, no re-running.',
  },
  {
    title: 'Roommate matching',
    text: 'Post a space or a seeker profile, browse listings, and message matches — all on-platform, contact details redacted until you both agree.',
  },
];

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSignup = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);
    trackEvent('signup_attempted');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes('rate limit') || message.includes('over_email_send_rate_limit')) {
        setError('Too many confirmation emails were requested. Wait a few minutes, then try again.');
      } else {
        setError(error.message);
      }
      trackEvent('signup_failed');
      setLoading(false);
      return;
    }

    // Profile row is created automatically by a database trigger (see database/rls_policies.sql).
    // Only sync the name here when we already have a session (RLS requires auth).
    if (data.user && data.session) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        email,
        tos_accepted: false,
      });

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }
    }

    if (!data.session) {
      setNotice('Check your email and confirm your account before logging in. After confirmation, sign in and continue to RentPilot.');
      trackEvent('signup_confirmation_required');
      setLoading(false);
      return;
    }

    trackEvent('signup_completed');
    router.push('/accept-terms');
    setLoading(false);
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <Card className="space-y-6 border-brand-green/15 bg-[radial-gradient(circle_at_top_left,_rgba(61,217,151,0.14),_transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 sm:p-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-green/70">
            Create account
          </p>
          <h1 className="font-sora text-3xl font-bold sm:text-4xl">Save your results free</h1>
          <p className="text-sm leading-relaxed text-white/65">
            The tools are free and work without an account. Sign up to save results permanently and unlock roommate matching.
          </p>
        </div>

        <div className="space-y-4">
          <Input
            placeholder="Full name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
          <Input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          {notice && <p className="text-sm text-green-300">{notice}</p>}
          <Button className="w-full" onClick={handleSignup} disabled={loading}>
            {loading ? 'Creating account...' : 'Sign up'}
          </Button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65">
          <p className="font-medium text-white">Student tip</p>
          <p className="mt-1">
            If you use a `.edu` email, RentPilot can show a verified-student badge in matching surfaces after signup.
          </p>
        </div>

        <p className="text-sm text-white/60">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-green">
            Sign in
          </Link>
        </p>
      </Card>

      <div className="space-y-4">
        {SIGNUP_BENEFITS.map((item) => (
          <Card key={item.title} className="border-white/10 bg-white/[0.04] p-5">
            <p className="font-semibold text-white">{item.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{item.text}</p>
          </Card>
        ))}

        <Card className="border-amber-400/20 bg-amber-400/5 p-5 text-sm text-amber-100/85">
          <p className="font-semibold text-amber-100">Important</p>
          <p className="mt-2 leading-relaxed">
            RentPilot helps you assess renter decisions, but it does not become part of your lease, housing transaction, or roommate agreement. You still need to verify listings, landlords, and legal issues before acting.
          </p>
        </Card>
      </div>
    </div>
  );
}
