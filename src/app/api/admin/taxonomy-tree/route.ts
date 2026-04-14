import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/**
 * GET /api/admin/taxonomy-tree?categoryType=Individual
 *
 * Returns categories with nested subcategories and sub-subcategories.
 * Respects the exact same DB schema as the .NET panel:
 *   MasterCategory (CategoryId, CategoryName, CategoryType, ...)
 *   MasterSubCategory (SubCategoryId, CategoryId FK, SubCategoryName, ...)
 *   MasterSubCategory1 (SubCategory1Id, SubCategoryId FK, SubCategory1Name, ...)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryType = searchParams.get('categoryType') || 'Individual';

    const db = await getDb();

    // 1. Get categories filtered by type
    const categories = await db.request()
      .input('type', categoryType)
      .query(`
        SELECT CategoryId, CategoryName, CategoryType, SequenceNumber,
               IsBodyMeasurementRequired, IsAuditionRequired, IsVocalCategory,
               StatusId, DTStamp, CreatedBy, UpdatedDTStamp, UpdatedBy
        FROM MasterCategory
        WHERE StatusId = 1 AND CategoryType = @type
        ORDER BY SequenceNumber ASC, CategoryName ASC
      `);

    // 2. Get ALL active subcategories (we'll group them client-side)
    const subcategories = await db.request().query(`
      SELECT SubCategoryId, CategoryId, SubCategoryName, SequenceNumber,
             StatusId, DTStamp, CreatedBy, UpdatedDTStamp, UpdatedBy
      FROM MasterSubCategory
      WHERE StatusId = 1
      ORDER BY SequenceNumber ASC, SubCategoryName ASC
    `);

    // 3. Get ALL active sub-subcategories
    const subcategories1 = await db.request().query(`
      SELECT SubCategory1Id, SubCategoryId, SubCategory1Name, SequenceNumber,
             StatusId, DTStamp, CreatedBy, UpdatedDTStamp, UpdatedBy
      FROM MasterSubCategory1
      WHERE StatusId = 1
      ORDER BY SequenceNumber ASC, SubCategory1Name ASC
    `);

    // Build tree: Category → SubCategory[] → SubCategory1[]
    const subMap1 = new Map<number, any[]>();
    for (const sc1 of subcategories1.recordset) {
      const arr = subMap1.get(sc1.SubCategoryId) || [];
      arr.push(sc1);
      subMap1.set(sc1.SubCategoryId, arr);
    }

    const subMap = new Map<number, any[]>();
    for (const sc of subcategories.recordset) {
      const arr = subMap.get(sc.CategoryId) || [];
      arr.push({
        ...sc,
        children: subMap1.get(sc.SubCategoryId) || [],
      });
      subMap.set(sc.CategoryId, arr);
    }

    const tree = categories.recordset.map((cat: any) => ({
      ...cat,
      children: subMap.get(cat.CategoryId) || [],
    }));

    return NextResponse.json({ tree, total: tree.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
