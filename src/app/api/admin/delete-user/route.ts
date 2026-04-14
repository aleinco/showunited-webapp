import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { id, type } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
    }

    const db = await getDb();

    if (type === 'company') {
      // Soft delete: set StatusId to 0
      await db.request()
        .input('id', parseInt(id, 10))
        .query('UPDATE MasterCompanyUser SET StatusId = 0, UpdatedDTStamp = GETDATE() WHERE CompanyUserId = @id');
    } else {
      // Delete related data first, then soft-delete user
      const userId = parseInt(id, 10);
      await db.request().input('id', userId)
        .query('UPDATE IndividualUserImage SET StatusId = 0 WHERE IndividualUserId = @id');
      await db.request().input('id', userId)
        .query('UPDATE MasterIndividualUser SET StatusId = 0, UpdatedDTStamp = GETDATE() WHERE IndividualUserId = @id');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
