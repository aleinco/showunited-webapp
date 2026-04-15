import { NextRequest, NextResponse } from 'next/server';
import { getDb, sql } from '@/lib/db';

/**
 * Fallback SQL-direct save for registration steps.
 * The Rushkar API (IndividualRegistration1/2) silently drops some fields.
 * This route ensures data actually persists.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { step, userId, data } = body;

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Missing userId' }, { status: 400 });
    }

    const pool = await getDb();
    const uid = Number(userId);

    // Step 4: Personal Info
    if (step === 'personal-info') {
      const sets: string[] = [];
      const req = pool.request().input('uid', sql.Int, uid);

      if (data.firstName) {
        sets.push('FirstName = @firstName');
        req.input('firstName', sql.NVarChar(200), data.firstName.trim());
      }
      if (data.lastName) {
        sets.push('LastName = @lastName');
        req.input('lastName', sql.NVarChar(200), data.lastName.trim());
      }
      if (data.countryCallingCode) {
        sets.push('CountryCallingCode = @callingCode');
        req.input('callingCode', sql.NVarChar(10), data.countryCallingCode);
      }
      if (data.phoneNumber) {
        sets.push('PhoneNumber = @phone');
        req.input('phone', sql.NVarChar(50), data.phoneNumber);
      }
      if (data.gender) {
        sets.push('Gender = @gender');
        req.input('gender', sql.NVarChar(50), data.gender);
      }
      if (data.countryId !== undefined && data.countryId !== '') {
        sets.push('CountryId = @countryId');
        req.input('countryId', sql.NVarChar(500), data.countryId);
      }
      if (data.cityId !== undefined && data.cityId !== '') {
        sets.push('CityId = @cityId');
        req.input('cityId', sql.NVarChar(500), data.cityId);
      }
      if (data.bithDate) {
        sets.push('BithDate = @bithDate');
        req.input('bithDate', sql.DateTime, new Date(data.bithDate));
      }
      if (data.isInterestedInInternationalTouring !== undefined) {
        sets.push('IsInterestedInInternationalTouring = @touring');
        req.input('touring', sql.Bit, data.isInterestedInInternationalTouring ? 1 : 0);
      }

      sets.push('UpdatedDTStamp = GETDATE()');

      if (sets.length > 1) {
        await req.query(`UPDATE MasterIndividualUser SET ${sets.join(', ')} WHERE IndividualUserId = @uid`);
      }

      return NextResponse.json({ ok: true, message: 'Personal info saved via SQL' });
    }

    // Step 5: Categories
    if (step === 'categories') {
      const sets: string[] = [];
      const req = pool.request().input('uid', sql.Int, uid);

      if (data.categoryId) {
        sets.push('CategoryId = @catId');
        req.input('catId', sql.Int, Number(data.categoryId));
      }
      if (data.subCategoryId) {
        sets.push('SubCategoryId = @subCatId');
        req.input('subCatId', sql.Int, Number(data.subCategoryId));
      }
      if (data.subCategory1Id) {
        sets.push('SubCategory1Id = @sub1Id');
        req.input('sub1Id', sql.Int, Number(data.subCategory1Id));
      }
      if (data.vocalCategoryId) {
        sets.push('VocalCategoryId = @vocalId');
        req.input('vocalId', sql.NVarChar(200), data.vocalCategoryId);
      }

      sets.push('UpdatedDTStamp = GETDATE()');

      if (sets.length > 1) {
        await req.query(`UPDATE MasterIndividualUser SET ${sets.join(', ')} WHERE IndividualUserId = @uid`);
      }

      return NextResponse.json({ ok: true, message: 'Categories saved via SQL' });
    }

    return NextResponse.json({ ok: false, error: 'Invalid step' }, { status: 400 });
  } catch (error: any) {
    console.error('register-save error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
