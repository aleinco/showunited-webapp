import { NextResponse } from 'next/server';

const ADMIN_URL = process.env.ADMIN_API_URL || 'https://admin.showunited.com';
const ADMIN_USER = 'admin';
const ADMIN_PASS = '123456';

// Shared session cache
let sessionCookies = '';
let sessionExpiry = 0;

async function getSession(): Promise<string> {
  if (sessionCookies && Date.now() < sessionExpiry) return sessionCookies;

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

  const loginRes = await fetch(`${ADMIN_URL}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookieHeader,
      'User-Agent': 'ShowUnited-Dashboard/2.0',
    },
    body: new URLSearchParams({
      'home.UserName': ADMIN_USER,
      'home.Password': ADMIN_PASS,
      '__RequestVerificationToken': verificationToken,
    }).toString(),
    redirect: 'manual',
  });

  const setCookies = loginRes.headers.getSetCookie?.() || [];
  const allParts = [...initCookies, ...setCookies]
    .map((c) => c.split(';')[0])
    .filter((c) => c.includes('='));

  sessionCookies = allParts.join('; ');
  sessionExpiry = Date.now() + 15 * 60 * 1000;
  return sessionCookies;
}

interface ParsedUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  category: string;
  subCategory: string;
  status: string;
  lastLogin: string;
  createdDate: string;
}

function parseUsersHtml(html: string): ParsedUser[] {
  const users: ParsedUser[] = [];

  // Headers: UserId, Name, Category, Sub Category, Sub Category 1, Email, PhoneNumber, Status, Last Login Date, Created Date, Action
  // Each row is a <tr> with <td> cells
  const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/);
  if (!tbodyMatch) return users;

  const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
  let rowMatch;
  while ((rowMatch = rowRegex.exec(tbodyMatch[1])) !== null) {
    const cells: string[] = [];
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
    let tdMatch;
    while ((tdMatch = tdRegex.exec(rowMatch[1])) !== null) {
      // Strip HTML tags, clean whitespace
      const text = tdMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      cells.push(text);
    }

    // Also extract ID from edit/delete links
    const idMatch = rowMatch[1].match(/Save\/(\d+)/) ||
                    rowMatch[1].match(/DeleteConfirmation[^']*\('(\d+)'\)/) ||
                    rowMatch[1].match(/ViewDetails\((\d+)\)/);

    if (cells.length >= 10) {
      const userId = idMatch ? parseInt(idMatch[1], 10) : parseInt(cells[0], 10) || 0;
      users.push({
        id: userId,
        name: cells[1] || '---',
        category: cells[2] || '---',
        subCategory: cells[3] || cells[4] || '---',
        email: cells[5] || '---',
        phone: cells[6] || '---',
        status: cells[7] || '---',
        lastLogin: cells[8] || '',
        createdDate: cells[9] || '',
      });
    }
  }

  return users;
}

// Cache users for 2 minutes
let cachedUsers: any[] | null = null;
let cacheTime = 0;

/**
 * GET /api/admin/users-list
 * Returns ALL individual users from the .NET admin panel
 */
export async function GET() {
  try {
    // Return cache if fresh
    if (cachedUsers && Date.now() - cacheTime < 120_000) {
      return NextResponse.json({ users: cachedUsers, total: cachedUsers.length });
    }

    let cookies = await getSession();

    const res = await fetch(`${ADMIN_URL}/IndividualUser/GetIndividualUserData`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: cookies,
        'User-Agent': 'ShowUnited-Dashboard/2.0',
      },
      body: 'PageNumber=1',
    });

    let html = await res.text();

    // Check for session expiry
    if (html.includes('home.UserName') || html.includes('SignIn')) {
      sessionCookies = '';
      sessionExpiry = 0;
      cookies = await getSession();

      const retryRes = await fetch(`${ADMIN_URL}/IndividualUser/GetIndividualUserData`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: cookies,
          'User-Agent': 'ShowUnited-Dashboard/2.0',
        },
        body: 'PageNumber=1',
      });
      html = await retryRes.text();
    }

    const users = parseUsersHtml(html).map((u) => ({
      ...u,
      firstName: u.name.split(' ')[0] || '',
      lastName: u.name.split(' ').slice(1).join(' ') || '',
      countryCode: '',
      country: '',
      city: '',
      gender: '',
      statusId: u.status?.toLowerCase() === 'active' ? 1 : 0,
      photo: '',
      birthDate: '',
      subscriptionPlanId: 0,
      subscriptionExpiry: '',
      isProfileComplete: false,
      deviceType: '',
    }));

    // Cache result
    cachedUsers = users;
    cacheTime = Date.now();

    return NextResponse.json({ users, total: users.length });
  } catch (error: any) {
    return NextResponse.json({ users: [], total: 0, error: error.message }, { status: 500 });
  }
}
