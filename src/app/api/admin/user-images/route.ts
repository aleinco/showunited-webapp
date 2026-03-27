import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'https://api.showunited.com';

async function getApiToken(): Promise<string> {
  const res = await fetch(`${API_URL}/api/User/Login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Email: 'ac@adesign.es', Password: 'Show1637$' }),
  });
  const data = await res.json();
  return data?.responseData?.Token || '';
}

// Cache token for 1 hour
let cachedToken = '';
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  cachedToken = await getApiToken();
  tokenExpiry = Date.now() + 3600_000;
  return cachedToken;
}

/**
 * GET /api/admin/user-images?ids=67,91,88
 * Returns a map of userId -> first image URL
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) || [];

    if (ids.length === 0) {
      return NextResponse.json({ images: {} });
    }

    const token = await getToken();
    if (!token) {
      return NextResponse.json({ images: {} });
    }

    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const res = await fetch(`${API_URL}/api/User/GetUserDetailById`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ IndividualUserId: parseInt(id, 10) }),
        });
        const data = await res.json();
        const images = data?.responseData?.IndividualUserImageList || [];
        const firstImage = images[0]?.IndividualUserImage || '';
        return { id, image: firstImage };
      })
    );

    const images: Record<string, string> = {};
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.image) {
        images[r.value.id] = r.value.image;
      }
    }

    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: {} });
  }
}
