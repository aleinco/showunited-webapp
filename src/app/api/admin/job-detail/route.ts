import { NextRequest, NextResponse } from 'next/server';
import { getDb, sql } from '@/lib/db';
import { getValidatedAdminSession, adminUnauthorized } from '@/lib/admin-auth';

// Edit-prefill for the admin Job form. Calls the same stored procedure the API uses
// (spAPIGetJobDetailById) directly over the DB connection — no Bearer token. IndividualUserId
// is 0 (admin context). Returns { responseData: <job fields, PascalCase> } so the form is unchanged.
export async function GET(request: NextRequest) {
  if (!(await getValidatedAdminSession())) return adminUnauthorized();
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ responseCode: 'error', responseMessage: 'Missing id' }, { status: 400 });

    const db = await getDb();
    const result = await db
      .request()
      .input('pJSON', sql.NVarChar(sql.MAX), JSON.stringify({ CompanyJobId: Number(id), IndividualUserId: 0 }))
      .execute('spAPIGetJobDetailById');

    const row = result.recordset?.[0] as any;
    const responseData = row?.ResponseData ? JSON.parse(row.ResponseData) : null;
    return NextResponse.json({ responseCode: row?.ResponseCode ?? '200', responseData });
  } catch (e: any) {
    return NextResponse.json({ responseCode: 'error', responseMessage: e?.message }, { status: 500 });
  }
}
