import { NextRequest, NextResponse } from 'next/server';
import { getDb, sql } from '@/lib/db';
import { getValidatedAdminSession, adminUnauthorized } from '@/lib/admin-auth';

// HARD DELETE a company job and all its related rows. Super-admin only (validated session).
// Scope is any listing (ours or a company's). The schema has no FK constraints, so order is not
// enforced; children are removed first for cleanliness, each guarded in case a table lacks the
// column. Physical image files on disk are left as harmless orphans.
const CHILD_TABLES = [
  'CompanyJobApplication',
  'CompanyJobImage',
  'CompanyJobKeyResponsibility',
  'CompanyJobRequirement',
  'UserSaveJob',
];

export async function POST(request: NextRequest) {
  if (!(await getValidatedAdminSession())) return adminUnauthorized();
  try {
    const { id } = await request.json();
    const jobId = Number(id);
    if (!jobId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const db = await getDb();
    const exists = await db.request().input('id', sql.Int, jobId)
      .query('SELECT CompanyJobId FROM CompanyJob WHERE CompanyJobId = @id');
    if (!exists.recordset.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    for (const t of CHILD_TABLES) {
      try {
        await db.request().input('id', sql.Int, jobId)
          .query(`DELETE FROM ${t} WHERE CompanyJobId = @id`);
      } catch { /* table may not have this column; ignore */ }
    }
    await db.request().input('id', sql.Int, jobId)
      .query('DELETE FROM CompanyJob WHERE CompanyJobId = @id');

    return NextResponse.json({ responseCode: '200', deleted: jobId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
