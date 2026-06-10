import { NextRequest, NextResponse } from 'next/server';
import { getDb, sql } from '@/lib/db';
import { getValidatedAdminSession, adminUnauthorized } from '@/lib/admin-auth';

// HARD DELETE a company audition and all its related rows. Super-admin only (validated session).
// Scope is any listing (ours or a company's). No FK constraints in the schema; children removed
// first for cleanliness, each guarded. Physical image files on disk are left as harmless orphans.
const CHILD_TABLES = [
  'CompanyAuditionApplication',
  'CompanyAuditionImage',
  'UserSaveAudition',
];

export async function POST(request: NextRequest) {
  if (!(await getValidatedAdminSession())) return adminUnauthorized();
  try {
    const { id } = await request.json();
    const auditionId = Number(id);
    if (!auditionId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const db = await getDb();
    const exists = await db.request().input('id', sql.Int, auditionId)
      .query('SELECT CompanyAuditionId FROM CompanyAudition WHERE CompanyAuditionId = @id');
    if (!exists.recordset.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    for (const t of CHILD_TABLES) {
      try {
        await db.request().input('id', sql.Int, auditionId)
          .query(`DELETE FROM ${t} WHERE CompanyAuditionId = @id`);
      } catch { /* table may not have this column; ignore */ }
    }
    await db.request().input('id', sql.Int, auditionId)
      .query('DELETE FROM CompanyAudition WHERE CompanyAuditionId = @id');

    return NextResponse.json({ responseCode: '200', deleted: auditionId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
