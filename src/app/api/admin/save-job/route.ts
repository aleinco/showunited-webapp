import { NextRequest, NextResponse } from 'next/server';
import { saveJobViaAdmin } from '@/lib/su-admin-proxy';
import { getValidatedAdminSession, adminUnauthorized } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  if (!(await getValidatedAdminSession())) return adminUnauthorized();
  try {
    const f = await request.formData();
    const get = (k: string) => String(f.get(k) ?? '');
    const r = await saveJobViaAdmin({
      companyJobId: Number(get('CompanyJobId')) || 0,
      fields: {
        JobTitle: get('JobTitle'), Address1: get('Address1'), Address2: get('Address2'),
        Country: get('Country'), Pincode: get('Pincode'), City: get('City'), State: get('State'),
        TouringType: get('TouringType'), ProductionName: get('ProductionName'),
        jobStartDate: get('jobStartDate'), jobEndDate: get('jobEndDate'),
        categoryId: get('categoryId'), subCategoryId: get('subCategoryId'), aboutJob: get('aboutJob'),
      },
      files: f.getAll('files').filter((x): x is File => x instanceof File),
    });
    return NextResponse.json(
      r.ok ? { responseCode: '200', companyJobId: r.companyJobId, responseMessage: 'Saved' }
           : { responseCode: 'error', step: r.step, responseMessage: r.message }
    );
  } catch (e: any) {
    return NextResponse.json({ responseCode: 'error', responseMessage: e?.message || 'admin save-job error' }, { status: 500 });
  }
}
