import { NextRequest, NextResponse } from 'next/server';

const ADMIN_API = process.env.ADMIN_API_URL || 'https://admin.showunited.com';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Step 1: GET the login page to obtain anti-forgery token + initial cookies
    const pageRes = await fetch(`${ADMIN_API}/`, {
      method: 'GET',
      headers: { 'User-Agent': 'ShowUnited-Admin-Dashboard/1.0' },
    });
    const pageHtml = await pageRes.text();

    const tokenMatch = pageHtml.match(
      /name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"/
    );
    const verificationToken = tokenMatch?.[1] || '';

    const initCookies = pageRes.headers.getSetCookie?.() || [];
    const cookieHeader = initCookies.map((c) => c.split(';')[0]).join('; ');

    // Step 2: POST login
    const formData = new URLSearchParams();
    formData.append('home.UserName', username);
    formData.append('home.Password', password);
    formData.append('__RequestVerificationToken', verificationToken);

    const res = await fetch(`${ADMIN_API}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: cookieHeader,
        'User-Agent': 'ShowUnited-Admin-Dashboard/1.0',
      },
      body: formData.toString(),
      redirect: 'manual',
    });

    const setCookieHeaders = res.headers.getSetCookie?.() || [];

    // Combine all cookies: init + login response
    const allCookieParts = [...initCookies, ...setCookieHeaders]
      .map((c) => c.split(';')[0])
      .filter((c) => c.includes('='));

    // Check success: got session cookie or redirect
    const hasSession = allCookieParts.some((c) =>
      c.startsWith('.AspNetCore.Session=')
    );

    if (!hasSession && res.status !== 302) {
      // Check response body for login form (means auth failed)
      const body = await res.text().catch(() => '');
      if (body.includes('home.UserName') || !setCookieHeaders.length) {
        return NextResponse.json(
          { success: false, message: 'Invalid credentials' },
          { status: 401 }
        );
      }
    }

    // Build the cookie string to forward to .NET backend
    const cookieValue = allCookieParts.join('; ');

    // Use a raw Set-Cookie header to avoid Next.js double-encoding
    const response = NextResponse.json({ success: true });
    response.headers.set(
      'Set-Cookie',
      `admin_session=${encodeURIComponent(cookieValue)}; Path=/; Max-Age=86400; HttpOnly; SameSite=Lax`
    );

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
