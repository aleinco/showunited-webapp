import { NextRequest, NextResponse } from 'next/server';

const USER_API = 'https://api.showunited.com/api/User';

/**
 * POST /api/user/upload-image
 *
 * Proxies multipart/form-data image uploads to the Show United API.
 *
 * The SU API expects:
 *   - multipart/form-data with field name "files"
 *   - Bearer token in Authorization header
 *
 * Endpoints:
 *   - IndividualRegistration3 (during registration)
 *   - SaveIndividualUserImage (for existing users)
 *   - CompanyRegistration3 (during company registration)
 *   - SaveCompanyUserImage (for existing company users)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = formData.get('token') as string;
    const endpoint = formData.get('endpoint') as string;
    const files = formData.getAll('files') as File[];

    if (!token) {
      return NextResponse.json(
        { responseCode: 'error', responseMessage: 'Missing token' },
        { status: 400 }
      );
    }

    if (!endpoint) {
      return NextResponse.json(
        { responseCode: 'error', responseMessage: 'Missing endpoint' },
        { status: 400 }
      );
    }

    if (files.length === 0) {
      return NextResponse.json(
        { responseCode: 'error', responseMessage: 'No files provided' },
        { status: 400 }
      );
    }

    // Build new FormData for upstream API (only "files" field)
    const upstreamForm = new FormData();
    for (const file of files) {
      upstreamForm.append('files', file, file.name);
    }

    const res = await fetch(`${USER_API}/${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // Do NOT set Content-Type — fetch sets it with the boundary automatically
      },
      body: upstreamForm,
    });

    const text = await res.text();

    if (!text || text.trim() === '') {
      return NextResponse.json(
        res.ok
          ? { responseCode: '200', responseMessage: 'Upload successful' }
          : { responseCode: 'error', responseMessage: `API returned ${res.status}` }
      );
    }

    try {
      const json = JSON.parse(text);
      return NextResponse.json(json);
    } catch {
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
