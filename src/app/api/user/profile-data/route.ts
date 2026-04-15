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
            VocalCategoryId,
            AboutUs,
            Website
          FROM MasterIndividualUser
          WHERE IndividualUserId = @uid
        `);

      if (!result.recordset.length) {
        return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
      }

      const row = result.recordset[0];

      // Resolve country name from CountryId
      let countryName = '';
      if (row.CountryId) {
        const cRes = await pool
          .request()
          .input('cid', sql.Int, row.CountryId)
          .query('SELECT TOP 1 CountryName FROM MasterCountry WHERE CountryId = @cid');
        if (cRes.recordset.length) countryName = cRes.recordset[0].CountryName;
      }

      // Resolve city name from CityId
      let cityName = '';
      if (row.CityId) {
        const ciRes = await pool
          .request()
          .input('cid', sql.Int, row.CityId)
          .query('SELECT TOP 1 CityName FROM MasterCity WHERE CityId = @cid');
        if (ciRes.recordset.length) cityName = ciRes.recordset[0].CityName;
      }

      return NextResponse.json({
        ok: true,
        data: {
          ...row,
          CountryName: countryName,
          CityName: cityName,
          BithDate: row.BithDate ? new Date(row.BithDate).toISOString().split('T')[0] : '',
        },
      });
    }

    // ── SAVE user profile data ──
    if (action === 'save') {
      if (!data) {
        return NextResponse.json({ ok: false, error: 'Missing data' }, { status: 400 });
      }

      // Resolve country name -> CountryId
      let countryId: number | null = null;
      if (data.countryName) {
        const cRes = await pool
          .request()
          .input('cn', sql.NVarChar(200), data.countryName.trim())
          .query('SELECT TOP 1 CountryId FROM MasterCountry WHERE CountryName = @cn');
        if (cRes.recordset.length) {
          countryId = cRes.recordset[0].CountryId;
        }
      }

      // Resolve city name -> CityId
      let cityId: number | null = null;
      if (data.cityName) {
        const cQuery = countryId
          ? 'SELECT TOP 1 CityId FROM MasterCity WHERE CityName = @cn AND CountryId = @coid'
          : 'SELECT TOP 1 CityId FROM MasterCity WHERE CityName = @cn';
        const req = pool.request().input('cn', sql.NVarChar(200), data.cityName.trim());
        if (countryId) req.input('coid', sql.Int, countryId);
        const ciRes = await req.query(cQuery);
        if (ciRes.recordset.length) {
          cityId = ciRes.recordset[0].CityId;
        }
      }

      // Build SET clauses dynamically
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
      if (countryId !== null) {
        sets.push('CountryId = @countryId');
        req.input('countryId', sql.Int, countryId);
      }
      if (cityId !== null) {
        sets.push('CityId = @cityId');
        req.input('cityId', sql.Int, cityId);
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
      if (data.aboutUs !== undefined) {
        sets.push('AboutUs = @aboutUs');
        req.input('aboutUs', sql.NVarChar(500), data.aboutUs);
      }
      if (data.website !== undefined) {
        sets.push('Website = @website');
        req.input('website', sql.NVarChar(500), data.website);
      }

      if (sets.length === 0) {
        return NextResponse.json({ ok: false, error: 'No fields to update' }, { status: 400 });
      }

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
