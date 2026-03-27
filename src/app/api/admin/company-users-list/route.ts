import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'https://api.showunited.com';
const ADMIN_API = process.env.ADMIN_API_URL || 'https://admin.showunited.com';

let cachedToken = '';
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const res = await fetch(`${API_URL}/api/User/Login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Email: 'ac@adesign.es', Password: 'Show1637$' }),
  });
  const data = await res.json();
  cachedToken = data?.responseData?.Token || '';
  tokenExpiry = Date.now() + 3600_000;
  return cachedToken;
}

let cachedUsers: any[] | null = null;
let cacheTime = 0;

export async function GET(request: NextRequest) {
  try {
    const token = await getToken();
    if (!token) return NextResponse.json({ users: [], total: 0 });

    if (cachedUsers && Date.now() - cacheTime < 120_000) {
      return NextResponse.json({ users: cachedUsers, total: cachedUsers.length });
    }

    // Try to get IDs by probing GetUserDetailById for company user IDs
    // We know IDs range from ~41-46 based on admin panel data
    // Probe a range of IDs to find all company users
    const probeIds: number[] = [];
    for (let i = 30; i <= 60; i++) probeIds.push(i);

    const probeResults = await Promise.allSettled(
      probeIds.map(async (id) => {
        const res = await fetch(`${API_URL}/api/User/GetUserDetailById`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ CompanyUserId: id }),
        });
        const data = await res.json();
        if (data?.responseCode === '200' && data?.responseData?.CompanyUserId) {
          return data.responseData.CompanyUserId as number;
        }
        return null;
      })
    );
    const uniqueIds = probeResults
      .filter((r): r is PromiseFulfilledResult<number> => r.status === 'fulfilled' && r.value !== null)
      .map((r) => r.value);

    if (uniqueIds.length === 0) {
      return NextResponse.json({ users: [], total: 0 });
    }

    // Fetch full details for each company user
    const allUsers: any[] = [];
    const details = await Promise.allSettled(
      uniqueIds.map(async (id) => {
        const res = await fetch(`${API_URL}/api/User/GetUserDetailById`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ CompanyUserId: id }),
        });
        const data = await res.json();
        const d = data?.responseData || {};
        return {
          id: d.CompanyUserId || id,
          name: d.Name || '',
          email: d.CompanyEmail || d.Email || '',
          phone: d.ContactNumber || '',
          countryCode: d.CountryCallingCode || '',
          category: d.CategoryId ? `Cat ${d.CategoryId}` : '',
          subCategory: d.SubCategoryId ? `Sub ${d.SubCategoryId}` : '',
          industryType: d.IndustryTypeId || 0,
          industrySubType: d.IndustrySubTypeId || 0,
          country: d.Country || '',
          city: d.City || '',
          state: d.State || '',
          address: d.Address1 || '',
          website: d.Website || '',
          status: d.StatusId === 1 ? 'Active' : 'Inactive',
          statusId: d.StatusId,
          photo: d.CompanyLogoPath || '',
          createdDate: d.DTStamp || '',
          deviceType: d.DeviceType || '',
          subscriptionPlanId: d.SubscriptionPlanId || 0,
          subscriptionExpiry: d.SubscriptionExpiryDate || '',
          isProfileComplete: d.IsRegisterProfileComplete || false,
          registerStep: d.RegisterStep || 0,
          zipcode: d.Zipcode || '',
        };
      })
    );

    for (const r of details) {
      if (r.status === 'fulfilled' && r.value.id) allUsers.push(r.value);
    }

    cachedUsers = allUsers;
    cacheTime = Date.now();

    return NextResponse.json({ users: allUsers, total: allUsers.length });
  } catch (error: any) {
    return NextResponse.json({ users: [], total: 0, error: error.message }, { status: 500 });
  }
}
