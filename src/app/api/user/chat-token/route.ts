import { NextResponse } from 'next/server';
import twilio from 'twilio';

const {
  TWILIO_ACCOUNT_SID = '',
  TWILIO_API_KEY_SID = '',
  TWILIO_API_KEY_SECRET = '',
  TWILIO_CONVERSATIONS_SERVICE_SID = '',
} = process.env;

function extractUserFromToken(jwtToken: string): {
  userId: number;
  userType: 'Individual' | 'Company';
  identity: string;
} | null {
  try {
    const payload = JSON.parse(atob(jwtToken.split('.')[1]));
    const individualId = payload.IndividualUserId;
    const companyId = payload.CompanyUserId;

    if (individualId) {
      return {
        userId: Number(individualId),
        userType: 'Individual',
        identity: `Individual_${individualId}`,
      };
    }
    if (companyId) {
      return {
        userId: Number(companyId),
        userType: 'Company',
        identity: `Company_${companyId}`,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 401 });
    }

    const user = extractUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!TWILIO_API_KEY_SID || !TWILIO_API_KEY_SECRET) {
      return NextResponse.json(
        { error: 'Twilio API key not configured' },
        { status: 500 }
      );
    }

    const AccessToken = twilio.jwt.AccessToken;
    const ChatGrant = AccessToken.ChatGrant;

    const accessToken = new AccessToken(
      TWILIO_ACCOUNT_SID,
      TWILIO_API_KEY_SID,
      TWILIO_API_KEY_SECRET,
      {
        identity: user.identity,
        ttl: 3600,
      }
    );

    const chatGrant = new ChatGrant({
      serviceSid: TWILIO_CONVERSATIONS_SERVICE_SID,
    });
    accessToken.addGrant(chatGrant);

    return NextResponse.json({
      twilioToken: accessToken.toJwt(),
      identity: user.identity,
      userId: user.userId,
      userType: user.userType,
      serviceSid: TWILIO_CONVERSATIONS_SERVICE_SID,
    });
  } catch (error: any) {
    console.error('Chat token error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate token' },
      { status: 500 }
    );
  }
}
