import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('cbt_token')?.value;
  const { pathname } = request.nextUrl;

  // Paths that require authentication
  const isAuthRequired = pathname.startsWith('/dashboard') || pathname.startsWith('/exam');

  // Guest-only paths (login, register)
  const isGuestOnly = pathname.startsWith('/login') || pathname.startsWith('/register');

  if (isAuthRequired && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isGuestOnly && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - next.svg, vercel.svg (default images)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|next.svg|vercel.svg).*)',
  ],
};
