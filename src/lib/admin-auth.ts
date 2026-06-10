import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isValidAdminSession } from '@/lib/admin-session';

/** Returns the decoded `admin_session` cookie value, or '' if absent. Mirrors api/admin/proxy. */
export async function getAdminSessionCookie(): Promise<string> {
  const store = await cookies();
  let decoded = store.get('admin_session')?.value || '';
  try {
    let prev = '';
    while (prev !== decoded) {
      prev = decoded;
      decoded = decodeURIComponent(decoded);
    }
  } catch {
    /* stop on decode error */
  }
  return decoded;
}

/**
 * Returns the `admin_session` cookie value ONLY if it is a genuine authenticated admin session
 * (validated against the .NET backend), else null. Use this in admin route handlers instead of
 * the presence-only getAdminSessionCookie(). Middleware already enforces this for every
 * /api/admin/* route; this is route-level defense in depth.
 */
export async function getValidatedAdminSession(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get('admin_session')?.value || '';
  return (await isValidAdminSession(raw)) ? raw : null;
}

/** Standard 401 for admin routes. */
export function adminUnauthorized() {
  return NextResponse.json(
    { responseCode: 'unauthorized', responseMessage: 'Not logged in', error: 'unauthorized' },
    { status: 401 }
  );
}
