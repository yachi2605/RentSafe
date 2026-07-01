'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { trackEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/button';

function LogoMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M13 2L3.5 6.5V13.5C3.5 18.75 7.75 23.25 13 24.5C18.25 23.25 22.5 18.75 22.5 13.5V6.5L13 2Z"
        fill="rgba(61,217,151,0.15)"
        stroke="rgba(61,217,151,0.6)"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <circle cx="13" cy="12" r="2.5" stroke="rgba(61,217,151,0.9)" strokeWidth="1.25" fill="none" />
      <line x1="13" y1="14.5" x2="13" y2="18" stroke="rgba(61,217,151,0.9)" strokeWidth="1.25" strokeLinecap="round" />
      <line x1="11.5" y1="16.5" x2="14.5" y2="16.5" stroke="rgba(61,217,151,0.9)" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

/** Links shown to anonymous visitors — tools front and center */
const ANON_NAV_LINKS = [
  { href: '/lease-analyzer', label: 'Lease Analyzer' },
  { href: '/scam-checker', label: 'Scam Detector' },
  { href: '/tenant-rights', label: 'Tenant Rights' },
  { href: '/match', label: 'Match' },
];

/** Links shown to authenticated users */
const AUTH_NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/lease-analyzer', label: 'Analyzer' },
  { href: '/scam-checker', label: 'Scam' },
  { href: '/match', label: 'Match' },
  { href: '/history/leases', label: 'History' },
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

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/');
  };

  const isActive = (href: string) => {
    if (href === '/history/leases') return pathname.startsWith('/history');
    if (href === '/match') {
      return pathname === '/match' || (pathname.startsWith('/match/') && !pathname.startsWith('/match/profile'));
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navLinks = userEmail ? AUTH_NAV_LINKS : ANON_NAV_LINKS;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-brand-navy/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-sora text-xl font-semibold text-white">
          <LogoMark />
          RentPilot
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 text-sm md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => trackEvent('navbar_link_clicked', { target: link.href })}
              className={`whitespace-nowrap transition-colors ${isActive(link.href) ? 'text-brand-green' : 'text-white/75 hover:text-white'}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          {userEmail ? (
            <div className="hidden items-center gap-3 md:flex">
              <span className="hidden max-w-[220px] truncate text-xs text-white/50 xl:inline">{userEmail}</span>
              <Link href="/match/profile">
                <Button variant="ghost" className="text-sm">Profile</Button>
              </Link>
              <Button variant="secondary" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/login" onClick={() => trackEvent('navbar_login_clicked')}>
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/signup" onClick={() => trackEvent('navbar_signup_clicked')}>
                {/* Copy reflects the actual value prop: save results, not "access tools" */}
                <Button>Save results free</Button>
              </Link>
            </div>
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
            {navLinks.map((link) => (
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
                <Link href="/match/profile" className="rounded-xl px-3 py-2.5 text-white/80 hover:bg-white/5">
                  Profile
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
                  onClick={() => trackEvent('navbar_signup_clicked', { surface: 'mobile' })}
                >
                  <Button className="w-full">Save free</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
