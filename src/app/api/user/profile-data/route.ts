import { NextRequest, NextResponse } from 'next/server';
import { getDb, sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, data } = body;

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: 'Missing userId' },
        { status: 400 }
      );
    }

    const pool = await getDb();

    // ── GET user profile data ──
    if (action === 'get') {
      const result = await pool
        .request()
        .input('uid', sql.Int, Number(userId))
        .query(`
          SELECT
            IndividualUserId,
            FirstName,
            LastName,
            Email,
            CountryCallingCode,
            PhoneNumber,
            Gender,
            CountryId,
            CityId,
            BithDate,
            IsInterestedInInternationalTouring,
            CategoryId,
            SubCategoryId,
            SubCategory1Id,
            VocalCategoryId
          FROM MasterIndividualUser
          WHERE IndividualUserId = @uid
        `);

      if (!result.recordset.length) {
        return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
      }

      const row = result.recordset[0];

      // CountryId and CityId are nvarchar(500) — they store text directly, not numeric IDs
      return NextResponse.json({
        ok: true,
        data: {
          ...row,
          BithDate: row.BithDate ? new Date(row.BithDate).toISOString().split('T')[0] : '',
        },
      });
    }

    // ── SAVE user profile data ──
    if (action === 'save') {
      if (!data) {
        return NextResponse.json({ ok: false, error: 'Missing data' }, { status: 400 });
      }

      const sets: string[] = [];
      const req = pool.request().input('uid', sql.Int, Number(userId));

      if (data.firstName !== undefined) {
        sets.push('FirstName = @firstName');
        req.input('firstName', sql.NVarChar(200), data.firstName);
      }
      if (data.lastName !== undefined) {
        sets.push('LastName = @lastName');
        req.input('lastName', sql.NVarChar(200), data.lastName);
      }
      if (data.gender !== undefined) {
        sets.push('Gender = @gender');
        req.input('gender', sql.NVarChar(50), data.gender);
      }
      if (data.bithDate !== undefined) {
        sets.push('BithDate = @bithDate');
        req.input('bithDate', sql.DateTime, data.bithDate ? new Date(data.bithDate) : null);
      }
      if (data.countryCallingCode !== undefined) {
        sets.push('CountryCallingCode = @callingCode');
        req.input('callingCode', sql.NVarChar(10), data.countryCallingCode);
      }
      if (data.phoneNumber !== undefined) {
        sets.push('PhoneNumber = @phone');
        req.input('phone', sql.NVarChar(50), data.phoneNumber);
      }
      // CountryId and CityId are nvarchar — store text directly
      if (data.countryId !== undefined || data.countryName !== undefined) {
        sets.push('CountryId = @countryId');
        req.input('countryId', sql.NVarChar(500), data.countryId || data.countryName || '');
      }
      if (data.cityId !== undefined || data.cityName !== undefined) {
        sets.push('CityId = @cityId');
        req.input('cityId', sql.NVarChar(500), data.cityId || data.cityName || '');
      }
      if (data.isInterestedInInternationalTouring !== undefined) {
        sets.push('IsInterestedInInternationalTouring = @touring');
        req.input('touring', sql.Bit, data.isInterestedInInternationalTouring ? 1 : 0);
      }
      if (data.categoryId !== undefined) {
        sets.push('CategoryId = @catId');
        req.input('catId', sql.Int, data.categoryId);
      }
      if (data.subCategoryId !== undefined) {
        sets.push('SubCategoryId = @subCatId');
        req.input('subCatId', sql.Int, data.subCategoryId);
      }

      if (sets.length === 0) {
        return NextResponse.json({ ok: false, error: 'No fields to update' }, { status: 400 });
      }

      sets.push('UpdatedDTStamp = GETDATE()');
      await req.query(`UPDATE MasterIndividualUser SET ${sets.join(', ')} WHERE IndividualUserId = @uid`);

      return NextResponse.json({ ok: true, message: 'Profile updated' });
    }

    return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('profile-data error:', error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
