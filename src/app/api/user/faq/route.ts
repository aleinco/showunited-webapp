import { NextRequest, NextResponse } from 'next/server';
import { getDb, sql } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getDb();

    const result = await pool.request().query(`
      SELECT FAQId, FAQQuestion, FAQAnswer
      FROM MasterFAQ
      WHERE FAQType = 'Individual' AND StatusId = 1
      ORDER BY FAQQuestionNumber
    `);

    return NextResponse.json({ ok: true, data: result.recordset });
  } catch (error: any) {
    console.error('faq route error:', error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
