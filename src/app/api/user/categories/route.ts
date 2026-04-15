import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getDb();
    const result = await pool
      .request()
      .query(
        'SELECT CategoryId, CategoryName FROM MasterCategory WHERE StatusId = 1 ORDER BY CategoryName'
      );

    const data = (result.recordset || []).map(
      (row: { CategoryId: number; CategoryName: string }) => ({
        id: row.CategoryId,
        name: row.CategoryName?.trim() || '',
      })
    );

    return NextResponse.json({ ok: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[categories] DB error:', message);
    return NextResponse.json(
      { ok: false, error: 'Failed to load categories' },
      { status: 500 }
    );
  }
}
