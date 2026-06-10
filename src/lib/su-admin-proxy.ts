// Server-to-server proxy from the super-admin dashboard (BFF) to the .NET admin app's
// AdminListing endpoints. Replaces the previous Bearer-token flow (su-official-token + the
// public api.showunited.com endpoints): listings are created/edited by calling the admin app
// with a shared secret header, and the .NET side owns them under the official ShowUnited
// company and writes images to the API host's wwwroot. No JWT / no stored company password.

const ADMIN_BASE = process.env.SU_ADMIN_BASE_URL || 'https://admin.showunited.com';
const SECRET = process.env.SU_ADMIN_PROXY_SECRET || '';

function ok(j: any): boolean {
  const c = String(j?.responseCode);
  return c === '1' || c === '200';
}

async function parseRes(res: Response): Promise<any> {
  const text = await res.text();
  if (!text || !text.trim()) {
    return res.ok ? { responseCode: '200', responseMessage: 'Success' } : { responseCode: 'error', responseMessage: `HTTP ${res.status}` };
  }
  try { return JSON.parse(text); } catch {
    return res.ok ? { responseCode: '200', responseMessage: text } : { responseCode: 'error', responseMessage: text };
  }
}

function headers(extra?: Record<string, string>): Record<string, string> {
  return { 'X-Admin-Proxy-Key': SECRET, ...(extra || {}) };
}

function toIso(d: string): string { if (!d) return ''; const dt = new Date(d); return isNaN(dt.getTime()) ? '' : dt.toISOString(); }
function toTime(t: string): string { if (!t) return '00:00:00'; const m = /^(\d{1,2}):(\d{2})/.exec(t); if (!m) return '00:00:00'; return `${m[1].padStart(2, '0')}:${m[2]}:00`; }

export interface SaveJobInput {
  companyJobId?: number; // 0 = create, non-zero = edit
  fields: Record<string, string>;
  files: File[];
}
export interface SaveJobResult { ok: boolean; step?: number; companyJobId?: number; message?: string; }

export async function saveJobViaAdmin(input: SaveJobInput): Promise<SaveJobResult> {
  if (!SECRET) return { ok: false, message: 'SU_ADMIN_PROXY_SECRET not configured' };
  const f = (k: string) => String(input.fields[k] ?? '');

  const fd1 = new FormData();
  fd1.append('CompanyJobId', String(input.companyJobId ?? 0));
  fd1.append('JobTitle', f('JobTitle'));
  fd1.append('Address1', f('Address1'));
  fd1.append('Address2', f('Address2'));
  fd1.append('Country', f('Country'));
  fd1.append('Pincode', f('Pincode'));
  fd1.append('City', f('City'));
  fd1.append('State', f('State'));
  fd1.append('TouringType', f('TouringType') || 'No');
  fd1.append('IsProductionDetailRequired', 'false');
  fd1.append('ProductionName', f('ProductionName'));
  fd1.append('ProductionLocation', '');
  fd1.append('DurationId', '0');
  fd1.append('CompanyJobImage', '');
  for (const file of input.files) fd1.append('files', file, file.name);

  const r1 = await fetch(`${ADMIN_BASE}/AdminListing/SaveJob1`, { method: 'POST', headers: headers(), body: fd1 });
  const j1 = await parseRes(r1);
  const companyJobId = j1?.responseData?.CompanyJobId;
  if (!ok(j1) || !companyJobId) return { ok: false, step: 1, message: j1?.responseMessage || 'SaveJob1 failed' };

  const jsonHeaders = headers({ 'Content-Type': 'application/json' });

  const r2 = await fetch(`${ADMIN_BASE}/AdminListing/SaveJob2`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify({
    companyJobId: Number(companyJobId) || 0,
    jobStartDate: f('jobStartDate'),
    jobEndDate: f('jobEndDate'),
    isSalaryConfirmOnDiscussion: true,
    salary: 0,
    rateOfPay: 0,
    categoryId: Number(f('categoryId')) || 0,
    subCategoryId: Number(f('subCategoryId')) || 0,
    subCategory1Id: 0,
    vocalCategory: '',
    skillId: '',
    aboutJob: f('aboutJob'),
  }) });
  const j2 = await parseRes(r2);
  if (!ok(j2)) return { ok: false, step: 2, companyJobId: Number(companyJobId), message: j2?.responseMessage || 'SaveJob2 failed' };

  const r3 = await fetch(`${ADMIN_BASE}/AdminListing/SaveJob3`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify({
    companyJobId: Number(companyJobId) || 0,
    companyKeyResponsibility: [],
    companyJobRequirement: [],
    isActive: true,
  }) });
  const j3 = await parseRes(r3);
  if (!ok(j3)) return { ok: false, step: 3, companyJobId: Number(companyJobId), message: j3?.responseMessage || 'SaveJob3 failed' };

  return { ok: true, companyJobId: Number(companyJobId) };
}

export interface SaveAuditionInput {
  companyAuditionId?: string | number; // '' = create, non-empty = edit
  fields: Record<string, string>;
  files: File[];
}
export interface SaveAuditionResult { ok: boolean; step?: number; companyAuditionId?: number; message?: string; }

export async function saveAuditionViaAdmin(input: SaveAuditionInput): Promise<SaveAuditionResult> {
  if (!SECRET) return { ok: false, message: 'SU_ADMIN_PROXY_SECRET not configured' };
  const f = (k: string) => String(input.fields[k] ?? '');

  const fd1 = new FormData();
  fd1.append('CompanyAuditionId', String(input.companyAuditionId ?? ''));
  fd1.append('AuditionTitle', f('AuditionTitle'));
  fd1.append('ProductionName', f('ProductionName'));
  fd1.append('ProductionLocation', f('ProductionLocation'));
  fd1.append('CategoryId', f('CategoryId'));
  fd1.append('SubCategoryId', f('SubCategoryId'));
  fd1.append('SubCategory1Id', '0');
  fd1.append('VocalCategory', '');
  fd1.append('DurationId', '0');
  fd1.append('Address1', f('Address1'));
  fd1.append('Address2', f('Address2'));
  fd1.append('City', f('City'));
  fd1.append('State', f('State'));
  fd1.append('Country', f('Country'));
  fd1.append('Pincode', f('Pincode'));
  fd1.append('IsProductionDetailRequired', 'false');
  fd1.append('CompanyAuditionImage', '');
  for (const file of input.files) fd1.append('files', file, file.name);

  const r1 = await fetch(`${ADMIN_BASE}/AdminListing/SaveAudition1`, { method: 'POST', headers: headers(), body: fd1 });
  const j1 = await parseRes(r1);
  const auditionId = j1?.responseData?.CompanyAuditionId;
  if (!ok(j1) || !auditionId) return { ok: false, step: 1, message: j1?.responseMessage || 'SaveAudition1 failed' };

  const jsonHeaders = headers({ 'Content-Type': 'application/json' });
  const r2 = await fetch(`${ADMIN_BASE}/AdminListing/SaveAudition2`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify({
    companyAuditionId: Number(auditionId) || 0,
    auditionStartDate: toIso(f('auditionStartDate')),
    auditionEndDate: toIso(f('auditionEndDate') || f('auditionStartDate')),
    auditionStartTime: toTime(f('auditionStartTime')),
    auditionEndTime: toTime(f('auditionEndTime')),
    aboutAudition: f('aboutAudition'),
    extraInformation: f('extraInformation'),
    isActive: true,
    skillId: '',
  }) });
  const j2 = await parseRes(r2);
  if (!ok(j2)) return { ok: false, step: 2, companyAuditionId: Number(auditionId), message: j2?.responseMessage || 'SaveAudition2 failed' };

  return { ok: true, companyAuditionId: Number(auditionId) };
}
