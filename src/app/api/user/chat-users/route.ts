import { NextResponse } from 'next/server';
import { getDb, sql } from '@/lib/db';

const IND_IMAGE_BASE = 'https://api.showunited.com/IndividualUserImage/';
const COMP_IMAGE_BASE = 'https://api.showunited.com/CompanyUserImage/';

export async function POST(request: Request) {
  try {
    const { token, identities } = await request.json();
    if (!token || !identities || !Array.isArray(identities)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const individuals: number[] = [];
    const companies: number[] = [];

    for (const identity of identities) {
      const match = identity.match(/^(Individual|Company)_(\d+)$/);
      if (match) {
        const [, type, id] = match;
        if (type === 'Individual') individuals.push(Number(id));
        else companies.push(Number(id));
      }
    }

    const db = await getDb();
    const users: Record<string, { name: string; photo: string; type: string }> = {};

    if (individuals.length > 0) {
      const placeholders = individuals.map((_, i) => `@ind${i}`).join(',');
      const req = db.request();
      individuals.forEach((id, i) => req.input(`ind${i}`, sql.Int, id));

      const result = await req.query(`
        SELECT
          u.IndividualUserId as id,
          ISNULL(u.FirstName, '') + ' ' + ISNULL(u.LastName, '') as name,
          (SELECT TOP 1 IndividualUserImage FROM IndividualUserImage
           WHERE IndividualUserId = u.IndividualUserId AND StatusId = 1
           ORDER BY IndividualUserImageId ASC) as photo
        FROM MasterIndividualUser u
        WHERE u.IndividualUserId IN (${placeholders})
      `);

      for (const row of result.recordset) {
        const name = (row.name || '').trim() || `User ${row.id}`;
        users[`Individual_${row.id}`] = {
          name,
          photo: row.photo ? `${IND_IMAGE_BASE}${row.photo}` : '',
          type: 'Individual',
        };
      }
    }

    if (companies.length > 0) {
      const placeholders = companies.map((_, i) => `@comp${i}`).join(',');
      const req = db.request();
      companies.forEach((id, i) => req.input(`comp${i}`, sql.Int, id));

      const result = await req.query(`
        SELECT
          c.CompanyUserId as id,
          ISNULL(c.CompanyName, '') as name,
          (SELECT TOP 1 CompanyUserImage FROM CompanyUserImage
           WHERE CompanyUserId = c.CompanyUserId AND StatusId = 1
           ORDER BY CompanyUserImageId ASC) as photo
        FROM MasterCompanyUser c
        WHERE c.CompanyUserId IN (${placeholders})
      `);

      for (const row of result.recordset) {
        const name = (row.name || '').trim() || `Company ${row.id}`;
        users[`Company_${row.id}`] = {
          name,
          photo: row.photo ? `${COMP_IMAGE_BASE}${row.photo}` : '',
          type: 'Company',
        };
      }
    }

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Chat users error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
