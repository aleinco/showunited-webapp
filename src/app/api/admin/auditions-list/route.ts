import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getValidatedAdminSession, adminUnauthorized } from '@/lib/admin-auth';

const IMAGE_BASE = 'https://api.showunited.com/CompanyAuditionImage/';

export async function GET() {
  if (!(await getValidatedAdminSession())) return adminUnauthorized();
  try {
    const officialId = Number(process.env.SU_OFFICIAL_COMPANY_ID || 0);
    const db = await getDb();
    const result = await db.request().query(`
      SELECT
        j.CompanyAuditionId   AS id,
        j.AuditionTitle       AS title,
        j.CompanyUserId       AS companyUserId,
        c.Name                AS companyName,
        c.Logo                AS companyLogo,
        cat.CategoryName      AS category,
        sc.SubCategoryName    AS subCategory,
        j.StatusId            AS statusId,
        ms.StatusName         AS statusName,
        j.AuditionStartDate   AS startDate,
        j.AuditionEndDate     AS endDate,
        CASE
          WHEN j.AuditionStartDate IS NULL OR j.AuditionEndDate IS NULL THEN 'unknown'
          WHEN j.AuditionStartDate > GETDATE() THEN 'upcoming'
          WHEN GETDATE() BETWEEN j.AuditionStartDate AND j.AuditionEndDate THEN 'live'
          ELSE 'finished'
        END                   AS schedule,
        (SELECT COUNT(*) FROM CompanyAuditionApplication a WHERE a.CompanyAuditionId = j.CompanyAuditionId) AS applications,
        (SELECT TOP 1 CompanyAuditionImage FROM CompanyAuditionImage i WHERE i.CompanyAuditionId = j.CompanyAuditionId ORDER BY CompanyAuditionImageId) AS thumb,
        j.DTStamp             AS createdDate,
        j.UpdatedDTStamp      AS updatedDate
      FROM CompanyAudition j
      LEFT JOIN MasterCompanyUser c ON j.CompanyUserId = c.CompanyUserId
      LEFT JOIN MasterCategory cat  ON j.CategoryId    = cat.CategoryId
      LEFT JOIN MasterSubCategory sc ON j.SubCategoryId = sc.SubCategoryId
      LEFT JOIN MasterStatus ms     ON j.StatusId      = ms.StatusId
      WHERE j.StatusId <> 3
      ORDER BY j.UpdatedDTStamp DESC, j.DTStamp DESC
    `);

    const auditions = result.recordset.map((r: any) => ({
      id: r.id,
      title: r.title || '---',
      companyUserId: r.companyUserId,
      companyName: r.companyName || '---',
      companyLogo: r.companyLogo || '',
      category: r.category || '---',
      subCategory: r.subCategory || '---',
      statusId: r.statusId,
      // Mirror the iOS/user-facing labels for the 3 listing states; fall back to the DB name otherwise.
      statusName: r.statusId === 1 ? 'Active' : r.statusId === 2 ? 'In Active' : r.statusId === 10 ? 'Closed' : (r.statusName || 'Active'),
      startDate: r.startDate || '',
      endDate: r.endDate || '',
      schedule: r.schedule || 'unknown',
      applications: r.applications || 0,
      thumb: r.thumb ? `${IMAGE_BASE}${r.thumb}` : '',
      createdDate: r.createdDate || '',
      updatedDate: r.updatedDate || '',
      isOurs: officialId > 0 && Number(r.companyUserId) === officialId,
    }));

    return NextResponse.json({ auditions, total: auditions.length });
  } catch (error: any) {
    return NextResponse.json({ auditions: [], total: 0, error: error.message }, { status: 500 });
  }
}
