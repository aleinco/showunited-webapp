import { NextRequest, NextResponse } from 'next/server';
import { getDb, sql } from '@/lib/db';

/**
 * Taxonomy CRUD API
 *
 * GET  /api/admin/taxonomy?table=MasterCategory&parentId=5&parentCol=CategoryId
 * POST /api/admin/taxonomy  { action: "create"|"update"|"delete", table, data, id }
 */

// Whitelist of allowed tables (security — prevent SQL injection)
const ALLOWED_TABLES: Record<string, { idCol: string; nameCol: string; parentCol?: string; parentTable?: string }> = {
  MasterCategory:       { idCol: 'CategoryId', nameCol: 'CategoryName' },
  MasterSubCategory:    { idCol: 'SubCategoryId', nameCol: 'SubCategoryName', parentCol: 'CategoryId', parentTable: 'MasterCategory' },
  MasterSubCategory1:   { idCol: 'SubCategory1Id', nameCol: 'SubCategory1Name', parentCol: 'SubCategoryId', parentTable: 'MasterSubCategory' },
  MasterVocalCategory:  { idCol: 'CategoryId', nameCol: 'CategoryName' },
  MasterHairColor:      { idCol: 'HairColorId', nameCol: 'HairColorName' },
  MasterIndustryType:   { idCol: 'IndustryTypeId', nameCol: 'IndustryTypeName' },
  MasterIndustrySubType:{ idCol: 'IndustrySubTypeId', nameCol: 'IndustrySubTypeName', parentCol: 'IndustryTypeId', parentTable: 'MasterIndustryType' },
  MasterSkill:          { idCol: 'SkillId', nameCol: 'SkillName' },
  MasterDuration:       { idCol: 'DurationId', nameCol: 'DurationName' },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table') || '';
    const parentId = searchParams.get('parentId');

    const config = ALLOWED_TABLES[table];
    if (!config) {
      return NextResponse.json({ error: `Invalid table: ${table}` }, { status: 400 });
    }

    const db = await getDb();
    let query = `SELECT * FROM ${table} WHERE StatusId = 1`;
    const req = db.request();

    if (parentId && config.parentCol) {
      query += ` AND ${config.parentCol} = @parentId`;
      req.input('parentId', sql.Int, parseInt(parentId, 10));
    }

    query += ' ORDER BY SequenceNumber ASC, ' + config.nameCol + ' ASC';

    const result = await req.query(query);
    return NextResponse.json({
      items: result.recordset,
      total: result.recordset.length,
      config: {
        idCol: config.idCol,
        nameCol: config.nameCol,
        parentCol: config.parentCol,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, table, data, id } = body;

    const config = ALLOWED_TABLES[table];
    if (!config) {
      return NextResponse.json({ error: `Invalid table: ${table}` }, { status: 400 });
    }

    const db = await getDb();

    switch (action) {
      case 'create': {
        const name = data?.[config.nameCol] || data?.name;
        if (!name) {
          return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const req = db.request();
        req.input('name', sql.NVarChar, name);
        req.input('seq', sql.Int, data?.SequenceNumber || 0);

        let insertCols = `${config.nameCol}, SequenceNumber, StatusId, DTStamp`;
        let insertVals = '@name, @seq, 1, GETDATE()';

        if (config.parentCol && data?.[config.parentCol]) {
          req.input('parentId', sql.Int, data[config.parentCol]);
          insertCols += `, ${config.parentCol}`;
          insertVals += ', @parentId';
        }

        // Handle extra columns for MasterCategory
        if (table === 'MasterCategory') {
          const categoryType = data?.CategoryType || 'Individual';
          req.input('categoryType', sql.NVarChar, categoryType);
          insertCols += ', CategoryType';
          insertVals += ', @categoryType';

          req.input('isBody', sql.Bit, data?.IsBodyMeasurementRequired ? 1 : 0);
          req.input('isAudition', sql.Bit, data?.IsAuditionRequired ? 1 : 0);
          req.input('isVocal', sql.Bit, data?.IsVocalCategory ? 1 : 0);
          insertCols += ', IsBodyMeasurementRequired, IsAuditionRequired, IsVocalCategory';
          insertVals += ', @isBody, @isAudition, @isVocal';
        }

        const result = await req.query(
          `INSERT INTO ${table} (${insertCols}) VALUES (${insertVals}); SELECT SCOPE_IDENTITY() as newId;`
        );

        return NextResponse.json({ success: true, id: result.recordset[0]?.newId });
      }

      case 'update': {
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const name = data?.[config.nameCol] || data?.name;
        const req = db.request();
        req.input('id', sql.Int, id);

        let setClauses = ['UpdatedDTStamp = GETDATE()'];

        if (name) {
          req.input('name', sql.NVarChar, name);
          setClauses.push(`${config.nameCol} = @name`);
        }

        if (data?.SequenceNumber !== undefined) {
          req.input('seq', sql.Int, data.SequenceNumber);
          setClauses.push('SequenceNumber = @seq');
        }

        if (table === 'MasterCategory') {
          if (data?.CategoryType !== undefined) {
            req.input('categoryType', sql.NVarChar, data.CategoryType);
            setClauses.push('CategoryType = @categoryType');
          }
          if (data?.IsBodyMeasurementRequired !== undefined) {
            req.input('isBody', sql.Bit, data.IsBodyMeasurementRequired ? 1 : 0);
            setClauses.push('IsBodyMeasurementRequired = @isBody');
          }
          if (data?.IsAuditionRequired !== undefined) {
            req.input('isAudition', sql.Bit, data.IsAuditionRequired ? 1 : 0);
            setClauses.push('IsAuditionRequired = @isAudition');
          }
          if (data?.IsVocalCategory !== undefined) {
            req.input('isVocal', sql.Bit, data.IsVocalCategory ? 1 : 0);
            setClauses.push('IsVocalCategory = @isVocal');
          }
        }

        await req.query(
          `UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${config.idCol} = @id`
        );

        return NextResponse.json({ success: true });
      }

      case 'delete': {
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        await db.request()
          .input('id', sql.Int, id)
          .query(`UPDATE ${table} SET StatusId = 0, UpdatedDTStamp = GETDATE() WHERE ${config.idCol} = @id`);

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
