import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

let cachedUsers: any[] | null = null;
let cacheTime = 0;

export async function GET() {
  try {
    if (cachedUsers && Date.now() - cacheTime < 120_000) {
      return NextResponse.json({ users: cachedUsers, total: cachedUsers.length });
    }

    const db = await getDb();

    const result = await db.request().query(`
      SELECT
        c.CompanyUserId as id,
        c.Name as name,
        c.Email,
        c.CompanyEmail,
        c.CountryCallingCode as countryCode,
        c.ContactNumber as phone,
        c.Website,
        c.ContactPersonName,
        c.ContactPersonEmail,
        c.Country,
        c.City,
        c.State,
        c.Address1 as address,
        c.StatusId,
        CASE WHEN c.StatusId = 1 THEN 'Active' ELSE 'Inactive' END as status,
        c.DTStamp as createdDate,
        c.SubscriptionPlanId,
        c.SubscriptionExpiryDate as subscriptionExpiry,
        c.DeviceType,
        c.CompanyLogoPath as photo,
        c.IsRegisterProfileComplete as isProfileComplete
      FROM MasterCompanyUser c
      ORDER BY c.DTStamp DESC
    `);

    const users = result.recordset.map((r: any) => ({
      id: r.id,
      name: r.name || '---',
      email: r.CompanyEmail || r.Email || '---',
      phone: r.phone || '',
      countryCode: r.countryCode || '',
      website: r.Website || '',
      contactPerson: r.ContactPersonName || '',
      contactEmail: r.ContactPersonEmail || '',
      country: r.Country || '',
      city: r.City || '',
      state: r.State || '',
      address: r.address || '',
      status: r.status,
      statusId: r.StatusId,
      photo: r.photo || '',
      createdDate: r.createdDate || '',
      subscriptionPlanId: r.SubscriptionPlanId || 0,
      subscriptionExpiry: r.subscriptionExpiry || '',
      isProfileComplete: r.isProfileComplete || false,
      deviceType: r.DeviceType || '',
    }));

    cachedUsers = users;
    cacheTime = Date.now();

    return NextResponse.json({ users, total: users.length });
  } catch (error: any) {
    return NextResponse.json({ users: [], total: 0, error: error.message }, { status: 500 });
  }
}
