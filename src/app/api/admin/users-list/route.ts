import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'https://api.showunited.com';

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

// Cache all users for 2 minutes to avoid hammering the API
let cachedUsers: any[] | null = null;
let cacheTime = 0;

/**
 * GET /api/admin/users-list
 * Returns ALL individual users with full details (name, email, phone, category, photo, status, dates)
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken();
    if (!token) return NextResponse.json({ users: [], total: 0 });

    // Return cache if fresh
    if (cachedUsers && Date.now() - cacheTime < 120_000) {
      return NextResponse.json({ users: cachedUsers, total: cachedUsers.length });
    }

    // Step 1: Get all user IDs + basic info from home list (paginated, 15 per page)
    const allBasic: any[] = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const res = await fetch(`${API_URL}/api/User/GetIndividualUserHomeList`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: 'All', page }),
      });
      const data = await res.json();
      const users = data?.responseData || [];
      allBasic.push(...users);
      const paging = data?.responsePagingData;
      hasMore = paging?.nextPage > 0;
      page++;
      if (page > 20) break; // safety limit
    }

    // Step 2: Fetch full details for each user in parallel (batches of 10)
    const allUsers: any[] = [];
    const batchSize = 10;
    for (let i = 0; i < allBasic.length; i += batchSize) {
      const batch = allBasic.slice(i, i + batchSize);
      const details = await Promise.allSettled(
        batch.map(async (u) => {
          const res = await fetch(`${API_URL}/api/User/GetUserDetailById`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ IndividualUserId: u.RecordId }),
          });
          const data = await res.json();
          const detail = data?.responseData || {};
          const detailImage = detail.IndividualUserImageList?.[0]?.IndividualUserImage || '';
          const logos = u.UserLogoList ? JSON.parse(u.UserLogoList) : [];
          const photo = detailImage || logos[0]?.UserLogoPath || '';

          return {
            id: u.RecordId,
            name: u.Title || `${detail.FirstName || ''} ${detail.LastName || ''}`.trim(),
            firstName: detail.FirstName || '',
            lastName: detail.LastName || '',
            email: detail.Email || '',
            phone: detail.PhoneNumber || '',
            countryCode: detail.CountryCallingCode || '',
            category: u.CategoryName || '',
            subCategory: u.SubCategoryName || '',
            country: detail.CountryId || '',
            city: detail.CityId || '',
            gender: detail.Gender || '',
            status: detail.StatusId === 1 ? 'Active' : 'Inactive',
            statusId: detail.StatusId,
            photo,
            birthDate: detail.BithDate || u.BithDate || '',
            createdDate: detail.DTStamp || '',
            lastLogin: detail.LastLoginDate || '',
            subscriptionPlanId: detail.SubscriptionPlanId || 0,
            subscriptionExpiry: detail.SubscriptionExpiryDate || '',
            isProfileComplete: detail.IsProfileComplete || false,
            deviceType: detail.DeviceType || '',
          };
        })
      );

      for (const r of details) {
        if (r.status === 'fulfilled') allUsers.push(r.value);
      }
    }

    // Cache result
    cachedUsers = allUsers;
    cacheTime = Date.now();

    return NextResponse.json({ users: allUsers, total: allUsers.length });
  } catch (error: any) {
    return NextResponse.json({ users: [], total: 0, error: error.message }, { status: 500 });
  }
}
