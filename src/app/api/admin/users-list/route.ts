import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Cache users for 2 minutes
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
        u.IndividualUserId as id,
        u.FirstName,
        u.LastName,
        ISNULL(u.FirstName, '') + ' ' + ISNULL(u.LastName, '') as name,
        u.Email,
        u.CountryCallingCode as countryCode,
        u.PhoneNumber as phone,
        u.Gender,
        u.CountryId as country,
        u.CityId as city,
        u.BithDate as birthDate,
        u.StatusId,
        CASE WHEN u.StatusId = 1 THEN 'Active' ELSE 'Inactive' END as status,
        u.DTStamp as createdDate,
        u.LastLoginDate as lastLogin,
        u.SubscriptionPlanId,
        u.SubscriptionExpiryDate as subscriptionExpiry,
        u.IsProfileComplete,
        u.DeviceType,
        c.CategoryName as category,
        sc.SubCategoryName as subCategory,
        (SELECT TOP 1 IndividualUserImage FROM IndividualUserImage
         WHERE IndividualUserId = u.IndividualUserId AND StatusId = 1
         ORDER BY IndividualUserImageId DESC) as photo
      FROM MasterIndividualUser u
      LEFT JOIN IndividualCategory c ON u.CategoryId = c.IndividualCategoryId
      LEFT JOIN IndividualSubCategory sc ON u.SubCategoryId = sc.IndividualSubCategoryId
      ORDER BY u.DTStamp DESC
    `);

    const users = result.recordset.map((r: any) => ({
      id: r.id,
      name: (r.name || '').trim() || '---',
      firstName: r.FirstName || '',
      lastName: r.LastName || '',
      email: r.Email || '---',
      phone: r.phone || '',
      countryCode: r.countryCode || '',
      category: r.category || '---',
      subCategory: r.subCategory || '---',
      country: r.country || '',
      city: r.city || '',
      gender: r.Gender || '',
      status: r.status,
      statusId: r.StatusId,
      photo: r.photo || '',
      birthDate: r.birthDate || '',
      createdDate: r.createdDate || '',
      lastLogin: r.lastLogin || '',
      subscriptionPlanId: r.SubscriptionPlanId || 0,
      subscriptionExpiry: r.subscriptionExpiry || '',
      isProfileComplete: r.IsProfileComplete || false,
      deviceType: r.DeviceType || '',
    }));

    cachedUsers = users;
    cacheTime = Date.now();

    return NextResponse.json({ users, total: users.length });
  } catch (error: any) {
    return NextResponse.json({ users: [], total: 0, error: error.message }, { status: 500 });
  }
}
