import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getValidatedAdminSession, adminUnauthorized } from '@/lib/admin-auth';

export async function GET() {
  if (!(await getValidatedAdminSession())) return adminUnauthorized();
  try {
    const db = await getDb();
    const cats = await db.request().query(
      `SELECT CategoryId AS id, CategoryName AS name, CategoryType AS type
       FROM MasterCategory WHERE StatusId = 1 ORDER BY SequenceNumber, CategoryName`
    );
    const subs = await db.request().query(
      `SELECT SubCategoryId AS id, CategoryId AS categoryId, SubCategoryName AS name
       FROM MasterSubCategory WHERE StatusId = 1 ORDER BY SequenceNumber, SubCategoryName`
    );
    return NextResponse.json({
      categories: cats.recordset.map((r: any) => ({ id: r.id, name: (r.name || '').trim(), type: r.type || '' })),
      subCategories: subs.recordset.map((r: any) => ({ id: r.id, categoryId: r.categoryId, name: (r.name || '').trim() })),
    });
  } catch (error: any) {
    return NextResponse.json({ categories: [], subCategories: [], error: error.message }, { status: 500 });
  }
}
