import { NextRequest, NextResponse } from 'next/server';

const USER_API = 'https://api.showunited.com/api/User';

/**
 * POST /api/user/feed
 *
 * Proxies feed requests to GetIndividualUserHomeList / GetCompanyUserHomeList.
 *
 * Body: {
 *   token: string,
 *   type?: 'All' | 'Job' | 'Audition' | 'Company' | 'Individual',
 *   search?: string,
 *   categoryId?: number,
 *   subCategoryId?: number,
 *   page?: number,
 *   feedType?: 'individual' | 'company',  // which endpoint to call
 * }
 *
 * Response shape from SU API:
 *   responseData: Array<{
 *     RecordId, RecordType, Title, CategoryName, SubCategoryName,
 *     BithDate, UserLogoList (JSON string), IsMultipleImage
 *   }>
 *   responsePagingData: { page, limit, total, nextPage }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      token,
      type = 'All',
      search,
      categoryId,
      subCategoryId,
      page = 1,
      feedType = 'individual',
    } = body;

    if (!token) {
      return NextResponse.json(
        { responseCode: 'error', responseMessage: 'Missing token' },
        { status: 400 }
      );
    }

    const endpoint =
      feedType === 'company'
        ? 'GetCompanyUserHomeList'
        : 'GetIndividualUserHomeList';

    const payload: Record<string, any> = { type, page };
    if (search) payload.search = search;
    if (categoryId) payload.categoryId = categoryId;
    if (subCategoryId) payload.subCategoryId = subCategoryId;

    const res = await fetch(`${USER_API}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();

    if (!text || text.trim() === '') {
      return NextResponse.json({
        responseCode: '200',
        responseData: [],
        responsePagingData: { page, limit: 15, total: 0, nextPage: null },
      });
    }

    try {
      const json = JSON.parse(text);

      // Parse UserLogoList JSON strings into arrays
      if (Array.isArray(json.responseData)) {
        json.responseData = json.responseData.map((item: any) => {
          if (typeof item.UserLogoList === 'string') {
            try {
              item.UserLogoList = JSON.parse(item.UserLogoList);
            } catch {
              item.UserLogoList = [];
            }
          }
          return item;
        });
      }

      return NextResponse.json(json);
    } catch {
      return NextResponse.json({
        responseCode: 'error',
        responseMessage: 'Invalid API response',
        responseData: [],
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { responseCode: 'error', responseMessage: error.message },
      { status: 500 }
    );
  }
}
