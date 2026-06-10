// Shared, runtime-agnostic (edge + node) validation of the `admin_session` cookie against the
// real .NET admin backend. Used by `middleware.ts` (the single enforcement point for every
// /api/admin/* route) and by `admin-auth.ts` (route-level defense in depth).
//
// The `admin_session` cookie is NOT a flag — it carries the user's genuine .NET
// `.AspNetCore.Session` cookies (set by /api/admin/login after authenticating against
// admin.showunited.com). So we can verify it for real instead of trusting its mere presence.

const ADMIN_API = process.env.ADMIN_API_URL || 'https://admin.showunited.com';

// Positive-result cache: decoded cookie value -> expiry epoch ms. ONLY valid sessions are
// cached, so a freshly-issued session can never be stuck as invalid, and bogus cookies never
// populate the cache (each forged cookie is re-checked and rejected).
const validUntil = new Map<string, number>();
const CACHE_TTL_MS = 60_000;

/** Fully URL-decode the cookie value (Next.js may have multiply-encoded it). */
function decodeCookie(raw: string): string {
  let decoded = raw;
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
 * Returns true iff `rawCookie` corresponds to a genuine authenticated .NET admin session.
 *
 * Validation: request an authenticated-only page (`/Home/DashBoard`) from the admin backend,
 * forwarding the session cookies. The .NET SessionHandler redirects an unauthenticated/expired
 * session to the login page, whose HTML contains the `home.UserName` login field; the real
 * dashboard does not. (Verified statically: `home.UserName` exists only in Login.cshtml.)
 *
 * Fails closed (returns false) on any network/parse error.
 */
export async function isValidAdminSession(rawCookie: string | undefined | null): Promise<boolean> {
  if (!rawCookie) return false;
  const cookie = decodeCookie(rawCookie);
  if (!cookie) return false;

  const now = Date.now();
  const exp = validUntil.get(cookie);
  if (exp && exp > now) return true;

  try {
    const res = await fetch(`${ADMIN_API}/Home/DashBoard`, {
      method: 'GET',
      headers: { Cookie: cookie, 'User-Agent': 'ShowUnited-Admin-Dashboard/1.0' },
      cache: 'no-store',
    });
    const text = await res.text();
    const valid = res.ok && !text.includes('home.UserName');
    if (valid) {
      validUntil.set(cookie, now + CACHE_TTL_MS);
    } else {
      validUntil.delete(cookie);
    }
    return valid;
  } catch {
    return false; // fail closed
  }
}
