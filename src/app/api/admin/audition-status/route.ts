import { NextRequest, NextResponse } from 'next/server';
import { getDb, sql } from '@/lib/db';
import { getValidatedAdminSession, adminUnauthorized } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  if (!(await getValidatedAdminSession())) return adminUnauthorized();
  try {
    const { id, newStatusId } = await request.json();
    const auditionId = Number(id);
    const status = Number(newStatusId);
    if (!auditionId || ![1, 2, 10].includes(status)) {
      return NextResponse.json({ error: 'Invalid id/status' }, { status: 400 });
    }
    const officialId = Number(process.env.SU_OFFICIAL_COMPANY_ID || 0);
    const db = await getDb();
    const owner = await db.request().input('id', sql.Int, auditionId)
      .query('SELECT CompanyUserId FROM CompanyAudition WHERE CompanyAuditionId = @id');
    if (!owner.recordset.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const isOurs = Number(owner.recordset[0].CompanyUserId) === officialId;
    // Companies' listings: close-only (StatusId = 10). Ours: any of 1/2/10.
    if (!isOurs && status !== 10) {
      return NextResponse.json({ error: 'Only close (10) is allowed on company listings' }, { status: 403 });
    }
    await db.request()
      .input('id', sql.Int, auditionId)
      .input('s', sql.Int, status)
      .query('UPDATE CompanyAudition SET StatusId = @s, UpdatedDTStamp = GETDATE() WHERE CompanyAuditionId = @id');
    return NextResponse.json({ responseCode: '200', statusId: status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
