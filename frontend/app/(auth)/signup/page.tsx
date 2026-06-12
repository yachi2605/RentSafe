'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
      setNotice('Check your email and confirm your account before logging in. After confirmation, sign in and continue to RentSafe.');
      setLoading(false);
      return;
    }

    router.push('/accept-terms');
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-3xl font-semibold">Create your account</h1>
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
      <p className="text-sm text-white/60">
        Already have an account?{' '}
        <Link href="/login" className="text-brand-green">
          Sign in
        </Link>
      </p>
    </div>
  );
}
