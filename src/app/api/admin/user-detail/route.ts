import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'individual';

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const db = await getDb();

    if (type === 'company') {
      const result = await db.request()
        .input('id', parseInt(id, 10))
        .query('SELECT * FROM MasterCompanyUser WHERE CompanyUserId = @id');
      if (!result.recordset[0]) {
        return NextResponse.json({ error: 'Company user not found' }, { status: 404 });
      }
      return NextResponse.json(result.recordset[0]);
    }

    // Individual user with category names
    const result = await db.request()
      .input('id', parseInt(id, 10))
      .query(`
        SELECT
          u.*,
          c.CategoryName as category,
          sc.SubCategoryName as subCategory
        FROM MasterIndividualUser u
        LEFT JOIN IndividualCategory c ON u.CategoryId = c.IndividualCategoryId
        LEFT JOIN IndividualSubCategory sc ON u.SubCategoryId = sc.IndividualSubCategoryId
        WHERE u.IndividualUserId = @id
      `);

    if (!result.recordset[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user images
    const images = await db.request()
      .input('id', parseInt(id, 10))
      .query(`
        SELECT IndividualUserImage, IndividualUserImageThumbnails
        FROM IndividualUserImage
        WHERE IndividualUserId = @id AND StatusId = 1
        ORDER BY IndividualUserImageId DESC
      `);

    const user = result.recordset[0];
    return NextResponse.json({
      ...user,
      IndividualUserImageList: images.recordset,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
