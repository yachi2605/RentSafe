/**
 * Auth middleware — hybrid model:
 *
 * PUBLIC (no login required):
 *   /lease-analyzer, /scam-checker, /tenant-rights
 *   /match (browse), /match/spaces/*, /match/seekers/*
 *   /history/* (shows localStorage results for anon, backend for logged-in)
 *
 * PROTECTED (login required):
 *   /dashboard — personal hub, meaningless without identity
 *   /match/post-space, /match/post-seeker — posting requires identity
 *   /match/profile — personal profile
 *   /match/my-matches — your matches list
 *   /match/chat/* — messaging requires identity
 *   /accept-terms — only reached by logged-in users without ToS
 *
 * ToS gate: logged-in users who haven't accepted terms are redirected to
 * /accept-terms (except when they're already on that page).
 */
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require a valid session. Checked via startsWith so sub-paths inherit.
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/match/post-space',
  '/match/post-seeker',
  '/match/profile',
  '/match/my-matches',
  '/match/chat',
];

function isProtected(path: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const path = req.nextUrl.pathname;

  // Redirect unauthenticated users away from protected routes.
  if (isProtected(path) && !session) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', path);
    return NextResponse.redirect(loginUrl);
  }

  // ToS gate: logged-in users who haven't accepted terms.
  if (session && path !== '/accept-terms') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('tos_accepted')
      .eq('id', session.user.id)
      .single();

    if (profile && !profile.tos_accepted) {
      return NextResponse.redirect(new URL('/accept-terms', req.url));
    }
  }

  return res;
}

export const config = {
  // Only run middleware on routes that could need auth checks.
  // Public tool pages are deliberately excluded — no middleware overhead.
  matcher: [
    '/dashboard/:path*',
    '/match/post-space/:path*',
    '/match/post-seeker/:path*',
    '/match/profile/:path*',
    '/match/my-matches/:path*',
    '/match/chat/:path*',
    '/accept-terms',
  ],
};
