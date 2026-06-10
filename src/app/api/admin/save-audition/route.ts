import { NextRequest, NextResponse } from 'next/server';
import { saveAuditionViaAdmin } from '@/lib/su-admin-proxy';
import { getValidatedAdminSession, adminUnauthorized } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  if (!(await getValidatedAdminSession())) return adminUnauthorized();
  try {
    const f = await request.formData();
    const get = (k: string) => String(f.get(k) ?? '');
    const r = await saveAuditionViaAdmin({
      companyAuditionId: get('CompanyAuditionId') || '',
      fields: {
        AuditionTitle: get('AuditionTitle'), ProductionName: get('ProductionName'), ProductionLocation: get('ProductionLocation'),
        CategoryId: get('CategoryId'), SubCategoryId: get('SubCategoryId'),
        Address1: get('Address1'), Address2: get('Address2'), City: get('City'), State: get('State'), Country: get('Country'), Pincode: get('Pincode'),
        auditionStartDate: get('auditionStartDate'), auditionEndDate: get('auditionEndDate'),
        auditionStartTime: get('auditionStartTime'), auditionEndTime: get('auditionEndTime'),
        aboutAudition: get('aboutAudition'), extraInformation: get('extraInformation'),
      },
      files: f.getAll('files').filter((x): x is File => x instanceof File),
    });
    return NextResponse.json(
      r.ok ? { responseCode: '200', companyAuditionId: r.companyAuditionId, responseMessage: 'Saved' }
           : { responseCode: 'error', step: r.step, responseMessage: r.message }
    );
  } catch (e: any) {
    return NextResponse.json({ responseCode: 'error', responseMessage: e?.message || 'admin save-audition error' }, { status: 500 });
  }
}
