'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes('email not confirmed')) {
        setError('Your email is not confirmed yet. Confirm it from your inbox, or resend the confirmation email below.');
      } else {
        setError(error.message);
      }
    } else {
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
    }

    setResending(false);
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-3xl font-semibold">Welcome back</h1>
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
    </div>
  );
}
