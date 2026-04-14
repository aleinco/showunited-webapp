import { NextRequest, NextResponse } from 'next/server';
import { getDb, sql } from '@/lib/db';

/**
 * GET /api/admin/user-images?ids=67,91,88
 * Returns a map of userId -> first image URL
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids')?.split(',').filter(Boolean).map(Number) || [];

    if (ids.length === 0) {
      return NextResponse.json({ images: {} });
    }

    const db = await getDb();

    // Build parameterized query for multiple IDs
    const req = db.request();
    const placeholders = ids.map((id, i) => {
      req.input(`id${i}`, sql.Int, id);
      return `@id${i}`;
    });

    const result = await req.query(`
      SELECT IndividualUserId, IndividualUserImage
      FROM (
        SELECT IndividualUserId, IndividualUserImage,
               ROW_NUMBER() OVER (PARTITION BY IndividualUserId ORDER BY IndividualUserImageId ASC) as rn
        FROM IndividualUserImage
        WHERE IndividualUserId IN (${placeholders.join(',')}) AND StatusId = 1
      ) sub
      WHERE rn = 1
    `);

    const images: Record<string, string> = {};
    for (const row of result.recordset) {
      if (row.IndividualUserImage) {
        images[String(row.IndividualUserId)] = row.IndividualUserImage;
      }
    }

    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: {} });
  }
}
