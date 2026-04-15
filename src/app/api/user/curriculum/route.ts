import { NextRequest, NextResponse } from 'next/server';
import { getDb, sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: 'Missing userId' },
        { status: 400 }
      );
    }

    const pool = await getDb();

    // Check if UserCurriculum table exists
    const tableCheck = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME = 'UserCurriculum'
    `);

    if (tableCheck.recordset.length === 0) {
      // Table does not exist — return empty list
      return NextResponse.json({
        ok: true,
        data: [],
        tableExists: false,
      });
    }

    // Get column info for reference
    const columns = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'UserCurriculum'
      ORDER BY ORDINAL_POSITION
    `);

    // Query curriculum files for this user
    // Build query dynamically based on available columns
    const colNames = columns.recordset.map((c: any) => c.COLUMN_NAME);

    // Common expected columns
    const hasUserId = colNames.includes('IndividualUserId');
    const userIdCol = hasUserId ? 'IndividualUserId' : (colNames.includes('UserId') ? 'UserId' : null);

    if (!userIdCol) {
      return NextResponse.json({
        ok: true,
        data: [],
        tableExists: true,
        columns: colNames,
        note: 'Could not determine user ID column',
      });
    }

    const result = await pool
      .request()
      .input('uid', sql.Int, Number(userId))
      .query(`SELECT * FROM UserCurriculum WHERE ${userIdCol} = @uid ORDER BY 1 DESC`);

    return NextResponse.json({
      ok: true,
      data: result.recordset,
      tableExists: true,
      columns: colNames,
    });
  } catch (error: any) {
    console.error('curriculum error:', error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
