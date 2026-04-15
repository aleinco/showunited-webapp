import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { getDb } from '@/lib/db';

const {
  TWILIO_ACCOUNT_SID = '',
  TWILIO_AUTH_TOKEN = '',
  TWILIO_CONVERSATIONS_SERVICE_SID = '',
} = process.env;

function extractUserFromToken(jwtToken: string): {
  identity: string;
  userId: number;
  userType: string;
} | null {
  try {
    const payload = JSON.parse(atob(jwtToken.split('.')[1]));
    const individualId = payload.IndividualUserId;
    const companyId = payload.CompanyUserId;
    if (individualId) return { identity: `Individual_${individualId}`, userId: Number(individualId), userType: 'Individual' };
    if (companyId) return { identity: `Company_${companyId}`, userId: Number(companyId), userType: 'Company' };
    return null;
  } catch {
    return null;
  }
}

function getConversationUniqueName(identityA: string, identityB: string): string {
  const [first, second] = [identityA, identityB].sort();
  return `chat_${first}_${second}`;
}

export async function POST(request: Request) {
  try {
    const { token, targetUserId, targetUserType } = await request.json();
    if (!token || !targetUserId || !targetUserType) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const user = extractUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const targetIdentity = `${targetUserType}_${targetUserId}`;
    const uniqueName = getConversationUniqueName(user.identity, targetIdentity);

    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const conversationsClient = client.conversations.v1.services(TWILIO_CONVERSATIONS_SERVICE_SID);

    try {
      const existing = await conversationsClient
        .conversations(uniqueName)
        .fetch();

      return NextResponse.json({
        conversationSid: existing.sid,
        isNew: false,
      });
    } catch {
      // Not found — create new
    }

    const friendlyName = `Chat ${user.identity} & ${targetIdentity}`;
    const conversation = await conversationsClient
      .conversations
      .create({
        uniqueName,
        friendlyName,
      });

    await conversationsClient
      .conversations(conversation.sid)
      .participants
      .create({ identity: user.identity });

    await conversationsClient
      .conversations(conversation.sid)
      .participants
      .create({ identity: targetIdentity });

    // Persist to ChatConversation so the .NET webhook doesn't fail on first message
    try {
      const db = await getDb();
      const [userAId, userAType, userBId, userBType] = user.identity < targetIdentity
        ? [user.userId, user.userType, targetUserId, targetUserType]
        : [targetUserId, targetUserType, user.userId, user.userType];

      await db.request()
        .input('conversationSid', conversation.sid)
        .input('userAId', String(userAId))
        .input('userAType', typeof userAType === 'string' ? userAType : String(userAType))
        .input('userBId', String(userBId))
        .input('userBType', typeof userBType === 'string' ? userBType : String(userBType))
        .query(`
          IF NOT EXISTS (SELECT 1 FROM ChatConversation WHERE ConversationSid = @conversationSid)
          INSERT INTO ChatConversation (ConversationSid, UserAId, UserAType, UserBId, UserBType, IsActive, CreatedOn)
          VALUES (@conversationSid, @userAId, @userAType, @userBId, @userBType, 1, GETUTCDATE())
        `);
    } catch (dbErr) {
      console.error('Failed to persist ChatConversation:', dbErr);
      // Non-fatal: Twilio conversation was created, DB persist is best-effort
    }

    return NextResponse.json({
      conversationSid: conversation.sid,
      isNew: true,
    });
  } catch (error: any) {
    console.error('Chat create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
