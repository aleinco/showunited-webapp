import { NextResponse } from 'next/server';
import { getDb, sql } from '@/lib/db';

function extractUserFromToken(jwtToken: string): {
  userId: number;
  userType: 'Individual' | 'Company';
} | null {
  try {
    const payload = JSON.parse(atob(jwtToken.split('.')[1]));
    if (payload.IndividualUserId) {
      return { userId: Number(payload.IndividualUserId), userType: 'Individual' };
    }
    if (payload.CompanyUserId) {
      return { userId: Number(payload.CompanyUserId), userType: 'Company' };
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const page = Number(url.searchParams.get('page') || '1');
    const pageSize = 20;

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 401 });
    }

    const user = extractUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const db = await getDb();
    const userColumn = user.userType === 'Individual' ? 'IndividualUserId' : 'CompanyUserId';
    const offset = (page - 1) * pageSize;

    const result = await db.request()
      .input('userId', sql.Int, user.userId)
      .input('offset', sql.Int, offset)
      .input('pageSize', sql.Int, pageSize)
      .query(`
        SELECT
          AdminChatId as id,
          IsSentByAdmin as isSentByAdmin,
          ChatMessage as message,
          ChatImage as image,
          IsRead as isRead,
          DTStamp as createdAt
        FROM AdminChat
        WHERE ${userColumn} = @userId AND StatusId = 1
        ORDER BY DTStamp ASC
        OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
      `);

    const countResult = await db.request()
      .input('userId', sql.Int, user.userId)
      .query(`
        SELECT COUNT(*) as total FROM AdminChat
        WHERE ${userColumn} = @userId AND StatusId = 1
      `);

    const total = countResult.recordset[0]?.total || 0;

    return NextResponse.json({
      messages: result.recordset,
      page,
      hasMore: offset + pageSize < total,
      total,
    });
  } catch (error: any) {
    console.error('Admin chat GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const token = formData.get('token') as string;
    const message = formData.get('ChatMessage') as string;

    if (!token || !message) {
      return NextResponse.json({ error: 'Token and message required' }, { status: 400 });
    }

    const user = extractUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const db = await getDb();
    const userColumn = user.userType === 'Individual' ? 'IndividualUserId' : 'CompanyUserId';

    const result = await db.request()
      .input('userId', sql.Int, user.userId)
      .input('message', sql.NVarChar(sql.MAX), message)
      .input('image', sql.NVarChar(500), '')
      .query(`
        INSERT INTO AdminChat (${userColumn}, IsSentByAdmin, ChatMessage, ChatImage, IsRead, StatusId, DTStamp, UpdatedDTStamp)
        OUTPUT INSERTED.AdminChatId as id, INSERTED.DTStamp as createdAt
        VALUES (@userId, 0, @message, @image, 0, 1, GETDATE(), GETDATE())
      `);

    return NextResponse.json({
      id: result.recordset[0]?.id,
      message,
      createdAt: result.recordset[0]?.createdAt,
    });
  } catch (error: any) {
    console.error('Admin chat POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
