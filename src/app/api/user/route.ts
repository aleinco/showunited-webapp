import { NextRequest, NextResponse } from 'next/server';

const USER_API = 'https://api.showunited.com/api/User';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, data, token } = body;

    if (!endpoint) {
      return NextResponse.json(
        { responseCode: 'error', responseMessage: 'Missing endpoint' },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${USER_API}/${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data || {}),
    });

    const text = await res.text();

    // Handle empty responses
    if (!text || text.trim() === '') {
      return NextResponse.json(
        res.ok
          ? { responseCode: '200', responseMessage: 'Success' }
          : { responseCode: 'error', responseMessage: `API returned ${res.status}` }
      );
    }

    try {
      const json = JSON.parse(text);
      return NextResponse.json(json);
    } catch {
      // Non-JSON response
      return NextResponse.json(
        res.ok
          ? { responseCode: '200', responseMessage: text }
          : { responseCode: 'error', responseMessage: text }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { responseCode: 'error', responseMessage: error.message },
      { status: 500 }
    );
  }
}
