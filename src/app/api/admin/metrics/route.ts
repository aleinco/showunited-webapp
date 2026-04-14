import { NextResponse } from 'next/server';

const ADMIN_URL = process.env.ADMIN_API_URL || 'https://admin.showunited.com';
const ADMIN_USER = 'admin';
const ADMIN_PASS = '123456';

// Session cache — auto-refreshes on expiry
let sessionCookies = '';
let sessionExpiry = 0;

async function getSession(): Promise<string> {
  if (sessionCookies && Date.now() < sessionExpiry) return sessionCookies;

  // Step 1: GET login page for anti-forgery token + initial cookies
  const pageRes = await fetch(`${ADMIN_URL}/`, {
    headers: { 'User-Agent': 'ShowUnited-Dashboard/2.0' },
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
  formData.append('home.UserName', ADMIN_USER);
  formData.append('home.Password', ADMIN_PASS);
  formData.append('__RequestVerificationToken', verificationToken);

  const loginRes = await fetch(`${ADMIN_URL}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookieHeader,
      'User-Agent': 'ShowUnited-Dashboard/2.0',
    },
    body: formData.toString(),
    redirect: 'manual',
  });

  const setCookies = loginRes.headers.getSetCookie?.() || [];
  const allCookieParts = [...initCookies, ...setCookies]
    .map((c) => c.split(';')[0])
    .filter((c) => c.includes('='));

  sessionCookies = allCookieParts.join('; ');
  // Session lasts ~20 min, refresh at 15 min
  sessionExpiry = Date.now() + 15 * 60 * 1000;

  return sessionCookies;
}

async function getCount(cookies: string, endpoint: string): Promise<number> {
  const res = await fetch(`${ADMIN_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookies,
      'User-Agent': 'ShowUnited-Dashboard/2.0',
    },
    body: 'PageNumber=1',
  });

  const html = await res.text();

  // Check for session expiry (redirected to login)
  if (html.includes('home.UserName') || html.includes('SignIn')) {
    return -1; // Signal to re-auth
  }

  const match = html.match(/Record Count:\s*(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// Cache metrics for 2 minutes
let cachedMetrics: Record<string, number> | null = null;
let cacheTime = 0;

const ENDPOINTS = [
  { key: 'totalIndividualUsers', endpoint: 'IndividualUser/GetIndividualUserData' },
  { key: 'totalCompanyUsers', endpoint: 'CompanyUser/GetCompanyUserData' },
  { key: 'totalSubscriptions', endpoint: 'UserSubscription/GetUserSubscriptionData' },
  { key: 'totalPlans', endpoint: 'SubscriptionPlan/GetSubscriptionPlanData' },
  { key: 'totalFaqs', endpoint: 'FAQ/GetFAQData' },
  { key: 'totalDisputes', endpoint: 'UserDispute/GetUserDisputeData' },
  { key: 'totalSkills', endpoint: 'Skill/GetSkillData' },
  { key: 'totalCategories', endpoint: 'IndividualCategory/GetIndividualCategoryData' },
];

export async function GET() {
  try {
    // Return cache if fresh
    if (cachedMetrics && Date.now() - cacheTime < 120_000) {
      return NextResponse.json(cachedMetrics);
    }

    let cookies = await getSession();

    const metrics: Record<string, number> = {};
    let needsReauth = false;

    // Fetch all counts in parallel
    const results = await Promise.allSettled(
      ENDPOINTS.map(async (ep) => {
        const count = await getCount(cookies, ep.endpoint);
        return { key: ep.key, count };
      })
    );

    for (const r of results) {
      if (r.status === 'fulfilled') {
        if (r.value.count === -1) {
          needsReauth = true;
        } else {
          metrics[r.value.key] = r.value.count;
        }
      }
    }

    // Re-auth and retry if session expired
    if (needsReauth) {
      sessionCookies = '';
      sessionExpiry = 0;
      cookies = await getSession();

      const retryResults = await Promise.allSettled(
        ENDPOINTS.map(async (ep) => {
          const count = await getCount(cookies, ep.endpoint);
          return { key: ep.key, count };
        })
      );

      for (const r of retryResults) {
        if (r.status === 'fulfilled' && r.value.count >= 0) {
          metrics[r.value.key] = r.value.count;
        }
      }
    }

    // Cache result
    cachedMetrics = metrics;
    cacheTime = Date.now();

    return NextResponse.json(metrics);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, totalIndividualUsers: 0, totalCompanyUsers: 0 },
      { status: 500 }
    );
  }
}
