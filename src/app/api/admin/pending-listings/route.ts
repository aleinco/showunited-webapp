import { NextResponse } from 'next/server';
import { getDb, sql } from '@/lib/db';

// GET — list scraper-seeded auditions awaiting review (StatusId=3 Pending, ReviewStatus='pending')
export async function GET() {
  try {
    const db = await getDb();
    const result = await db.request().query(`
      SELECT
        ca.CompanyAuditionId AS id,
        ca.AuditionTitle     AS title,
        ca.CategoryId        AS categoryId,
        mc.CategoryName      AS category,
        ca.City              AS city,
        ca.Country           AS country,
        ca.AboutAudition     AS about,
        ca.DTStamp           AS createdAt,
        sl.Source            AS source,
        sl.SourceUrl         AS sourceUrl,
        sl.Kind              AS kind
      FROM ScrapedListing sl
      INNER JOIN CompanyAudition ca ON ca.CompanyAuditionId = sl.CompanyAuditionId
      LEFT JOIN MasterCategory mc ON mc.CategoryId = ca.CategoryId
      WHERE sl.ReviewStatus = 'pending' AND ca.StatusId = 3
      ORDER BY ca.CompanyAuditionId DESC
    `);
    return NextResponse.json({ listings: result.recordset, total: result.recordset.length });
  } catch (error: any) {
    return NextResponse.json({ listings: [], total: 0, error: error.message }, { status: 500 });
  }
}

// POST — approve (publish -> StatusId 1) or reject (-> StatusId 2)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = Number(body?.id);
    const action = body?.action;
    if (!id || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json(
        { error: 'id and action (approve|reject) required' },
        { status: 400 }
      );
    }
    const newStatus = action === 'approve' ? 1 : 2;
    const review = action === 'approve' ? 'approved' : 'rejected';
    const db = await getDb();
    await db
      .request()
      .input('id', sql.Int, id)
      .input('st', sql.Int, newStatus)
      .query('UPDATE CompanyAudition SET StatusId=@st, UpdatedDTStamp=GETDATE() WHERE CompanyAuditionId=@id');
    await db
      .request()
      .input('id', sql.Int, id)
      .input('rv', sql.NVarChar(20), review)
      .query("UPDATE ScrapedListing SET ReviewStatus=@rv, LastSeen=GETDATE() WHERE CompanyAuditionId=@id");
    return NextResponse.json({ ok: true, id, action, newStatus });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
