import { NextRequest, NextResponse } from 'next/server';

const publicPaths = [
  '/signin',
  '/signup',
  '/register',
  '/api/admin/login',
  // User-facing routes (auth handled client-side via localStorage token)
  '/home',
  '/post',
  '/jobs',
  '/auditions',
  '/search',
  '/messages',
  '/notifications',
  '/create',
  '/user-gallery',
  '/profile',
  '/followers',
  '/settings',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths and static assets
  if (
    publicPaths.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for session cookie
  const session = request.cookies.get('admin_session');
  if (!session?.value) {
    const signInUrl = new URL('/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
