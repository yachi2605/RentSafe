'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-brand-navy/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-semibold text-white font-sora">
          RentSafe
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/lease-analyzer">Lease Analyzer</Link>
          <Link href="/scam-checker">Scam Detector</Link>
          <Link href="/tenant-rights">Tenant Rights</Link>
          <Link href="/match">Match</Link>
        </div>
        <div className="flex items-center gap-3">
          {userEmail ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/70">{userEmail}</span>
              <Button
                variant="secondary"
                onClick={() => supabase.auth.signOut()}
              >
                Sign out
              </Button>
            </div>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
