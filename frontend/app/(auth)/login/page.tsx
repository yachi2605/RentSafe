'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { trackEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const LOGIN_CONTEXT = [
  {
    title: 'Resume saved analyses',
    text: 'Open past lease reviews and scam checks without rerunning them.',
  },
  {
    title: 'Continue match conversations',
    text: 'Pick up your roommate search and keep early conversations on-platform.',
  },
  {
    title: 'Use grounded renter tools',
    text: 'Access rights guidance, protected AI usage, and your personalized dashboard.',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canResend = error?.toLowerCase().includes('email not confirmed') && email;

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);
    trackEvent('login_attempted');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes('email not confirmed')) {
        setError('Your email is not confirmed yet. Confirm it from your inbox, or resend the confirmation email below.');
      } else {
        setError(error.message);
      }
      trackEvent('login_failed');
    } else {
      trackEvent('login_completed');
      router.refresh();
      router.push('/dashboard');
    }
    setLoading(false);
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Enter your email first so we know where to send the confirmation link.');
      return;
    }

    setResending(true);
    setError(null);
    setNotice(null);

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes('rate limit') || message.includes('over_email_send_rate_limit')) {
        setError('Email resend limit reached. Wait a few minutes before trying again.');
      } else {
        setError(error.message);
      }
    } else {
      setNotice('Confirmation email sent. Check your inbox and spam folder.');
      trackEvent('signup_confirmation_resent');
    }

    setResending(false);
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <Card className="space-y-6 border-white/10 bg-white/[0.04] p-6 sm:p-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
            Sign in
          </p>
          <h1 className="font-sora text-3xl font-bold sm:text-4xl">Welcome back</h1>
          <p className="text-sm leading-relaxed text-white/65">
            Sign in to reopen your saved work, continue matching, and access protected renter tools.
          </p>
        </div>

        <div className="space-y-4">
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
          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
          {canResend && (
            <Button
              className="w-full"
              variant="ghost"
              onClick={handleResendConfirmation}
              disabled={resending}
            >
              {resending ? 'Sending confirmation...' : 'Resend confirmation email'}
            </Button>
          )}
        </div>

        <p className="text-sm text-white/60">
          New here?{' '}
          <Link href="/signup" className="text-brand-green">
            Create an account
          </Link>
        </p>
      </Card>

      <div className="space-y-4">
        {LOGIN_CONTEXT.map((item) => (
          <Card key={item.title} className="border-white/10 bg-white/[0.04] p-5">
            <p className="font-semibold text-white">{item.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{item.text}</p>
          </Card>
        ))}

        <Card className="border-sky-400/20 bg-sky-400/5 p-5 text-sm text-sky-100/85">
          <p className="font-semibold text-sky-100">Why confirmation matters</p>
          <p className="mt-2 leading-relaxed">
            Email confirmation reduces spam accounts and keeps renter histories, AI usage, and roommate messaging tied to real accounts instead of disposable sessions.
          </p>
        </Card>
      </div>
    </div>
  );
}
