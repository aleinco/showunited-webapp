import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'https://api.showunited.com';

let cachedToken = '';
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const res = await fetch(`${API_URL}/api/User/Login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Email: 'ac@adesign.es', Password: 'Show1637$' }),
  });
  const data = await res.json();
  cachedToken = data?.responseData?.Token || '';
  tokenExpiry = Date.now() + 3600_000;
  return cachedToken;
}

export async function GET(request: NextRequest) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const token = await getToken();
    if (!token) return NextResponse.json({ error: 'Auth failed' }, { status: 500 });

    const type = new URL(request.url).searchParams.get('type');
    const bodyParam = type === 'company'
      ? { CompanyUserId: parseInt(id, 10) }
      : { IndividualUserId: parseInt(id, 10) };

    const res = await fetch(`${API_URL}/api/User/GetUserDetailById`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bodyParam),
    });

    const data = await res.json();
    if (data?.responseCode === '200') {
      return NextResponse.json(data.responseData);
    }
    return NextResponse.json({ error: data?.responseMessage || 'Not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
