import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const IMAGE_BASE = 'https://api.showunited.com/IndividualUserImage/';

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
          sc.SubCategoryName as subCategory,
          sc1.SubCategory1Name as subCategory1,
          hc.HairColorName as hairColor,
          sp.Name as subscriptionPlanName
        FROM MasterIndividualUser u
        LEFT JOIN MasterCategory c ON u.CategoryId = c.CategoryId
        LEFT JOIN MasterSubCategory sc ON u.SubCategoryId = sc.SubCategoryId
        LEFT JOIN MasterSubCategory1 sc1 ON u.SubCategory1Id = sc1.SubCategory1Id
        LEFT JOIN MasterHairColor hc ON u.HairColorId = hc.HairColorId
        LEFT JOIN MasterSubscriptionPlan sp ON u.SubscriptionPlanId = sp.SubscriptionPlanId
        WHERE u.IndividualUserId = @id
      `);

    if (!result.recordset[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user images
    const images = await db.request()
      .input('id', parseInt(id, 10))
      .query(`
        SELECT IndividualUserImageId, IndividualUserImage, IndividualUserImageThumbnails, DTStamp
        FROM IndividualUserImage
        WHERE IndividualUserId = @id AND StatusId = 1
        ORDER BY IndividualUserImageId ASC
      `);

    const user = result.recordset[0];
    return NextResponse.json({
      ...user,
      IndividualUserImageList: images.recordset.map((img: any) => ({
        ...img,
        IndividualUserImage: img.IndividualUserImage ? `${IMAGE_BASE}${img.IndividualUserImage}` : '',
        IndividualUserImageThumbnails: img.IndividualUserImageThumbnails ? `${IMAGE_BASE}${img.IndividualUserImageThumbnails}` : '',
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
