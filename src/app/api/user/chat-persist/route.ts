import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function extractUserFromToken(jwtToken: string): {
  userId: number;
  userType: string;
} | null {
  try {
    const payload = JSON.parse(atob(jwtToken.split('.')[1]));
    const individualId = payload.IndividualUserId;
    const companyId = payload.CompanyUserId;
    if (individualId) return { userId: Number(individualId), userType: 'Individual' };
    if (companyId) return { userId: Number(companyId), userType: 'Company' };
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { token, conversationSid, messageSid, messageBody } = await request.json();

    if (!token || !conversationSid || !messageSid) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const user = extractUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const db = await getDb();

    // Insert only if not already persisted by the .NET webhook
    await db.request()
      .input('conversationSid', conversationSid)
      .input('messageSid', messageSid)
      .input('senderId', String(user.userId))
      .input('senderType', user.userType)
      .input('messageBody', messageBody || '')
      .query(`
        IF NOT EXISTS (SELECT 1 FROM ChatMessage WHERE MessageSid = @messageSid)
        INSERT INTO ChatMessage (ConversationSid, MessageSid, SenderId, SenderType, MessageBody, CreatedOn)
        VALUES (@conversationSid, @messageSid, @senderId, @senderType, @messageBody, GETUTCDATE())
      `);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Chat persist error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
