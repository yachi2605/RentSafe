'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { trackEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/button';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/match', label: 'Match' },
  { href: '/tenant-rights', label: 'Tenant Rights' },
  { href: '/history/leases', label: 'History' },
  { href: '/match/profile', label: 'Profile' },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [supabase] = useState(() => createClientComponentClient());
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
  }, [supabase]);

  // Close the mobile menu on navigation.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/history/leases') {
      return pathname.startsWith('/history');
    }
    if (href === '/match/profile') {
      return pathname === '/match/profile';
    }
    if (href === '/match') {
      return pathname === '/match' || (
        pathname.startsWith('/match/') &&
        !pathname.startsWith('/match/profile')
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-brand-navy/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href="/" className="font-sora text-xl font-semibold text-white">
          RentPilot
        </Link>

        <div className="hidden items-center gap-6 text-sm md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => trackEvent('navbar_link_clicked', { target: link.href })}
              className={isActive(link.href) ? 'text-brand-green' : 'text-white/75 hover:text-white'}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {userEmail ? (
            <div className="hidden items-center gap-3 md:flex">
              <span className="hidden text-xs text-white/70 xl:inline">{userEmail}</span>
              <Link href="/lease-analyzer" onClick={() => trackEvent('navbar_primary_cta_clicked', { target: '/lease-analyzer' })}>
                <Button>Analyze a lease</Button>
              </Link>
              <Button variant="secondary" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/signup" onClick={() => trackEvent('navbar_primary_cta_clicked', { target: '/signup' })}>
                <Button>Sign up</Button>
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-lg border border-white/15 p-2 text-white/80 md:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? (
                <>
                  <line x1="5" y1="5" x2="19" y2="19" />
                  <line x1="19" y1="5" x2="5" y2="19" />
                </>
              ) : (
                <>
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="border-t border-white/10 px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-1 pt-3 text-sm">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => trackEvent('navbar_link_clicked', { target: link.href, surface: 'mobile' })}
                className={`rounded-xl px-3 py-2.5 ${
                  isActive(link.href)
                    ? 'bg-brand-green/10 text-brand-green'
                    : 'text-white/80 hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {userEmail ? (
              <>
                <Link
                  href="/lease-analyzer"
                  onClick={() => trackEvent('navbar_primary_cta_clicked', { target: '/lease-analyzer', surface: 'mobile' })}
                  className="pt-2"
                >
                  <Button className="w-full">Analyze a lease</Button>
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-xl border border-white/15 px-3 py-2.5 text-left text-white/80"
                >
                  Sign out
                </button>
                <span className="px-1 pt-2 text-xs text-white/50">{userEmail}</span>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link href="/login" className="flex-1">
                  <Button variant="secondary" className="w-full">Log in</Button>
                </Link>
                <Link
                  href="/signup"
                  className="flex-1"
                  onClick={() => trackEvent('navbar_primary_cta_clicked', { target: '/signup', surface: 'mobile' })}
                >
                  <Button className="w-full">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
