import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/lease-analyzer',
  '/scam-checker',
  '/tenant-rights',
  '/match',
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const path = req.nextUrl.pathname;

  const isProtected = PROTECTED_ROUTES.some((route) => path.startsWith(route));

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

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
  matcher: [
    '/dashboard/:path*',
    '/lease-analyzer/:path*',
    '/scam-checker/:path*',
    '/tenant-rights/:path*',
    '/match/:path*',
    '/accept-terms',
  ],
};
