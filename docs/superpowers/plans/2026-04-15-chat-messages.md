# Chat/Messages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real-time peer-to-peer chat (Twilio) and admin support chat (SQL) to the Show United webapp at `/messages`.

**Architecture:** Two-tab chat interface — "Chats" tab uses Twilio Conversations JS SDK for real-time p2p messaging (compatible with iOS/Android apps), "Support" tab uses SQL Server polling on `AdminChat` table. Custom UI components with Tailwind + RizzUI, no external chat UI library.

**Tech Stack:** Next.js 15, React 19, @twilio/conversations (client), twilio (server), mssql, Tailwind CSS, RizzUI, Jotai, dayjs, axios

**Spec:** `docs/superpowers/specs/2026-04-15-chat-messages-design.md`

---

## File Map

### New Files

| File | Responsibility |
|---|---|
| `src/app/api/user/chat-token/route.ts` | Generate Twilio JWT AccessToken from user's auth token |
| `src/app/api/user/chat-users/route.ts` | Resolve Twilio identities to names/photos via SQL |
| `src/app/api/user/chat-create/route.ts` | Create or find existing Twilio conversation |
| `src/app/api/user/admin-chat/route.ts` | GET/POST admin support chat messages via SQL |
| `src/lib/twilio-chat.ts` | Client-side Twilio SDK wrapper (init, token refresh) |
| `src/app/(user)/messages/page.tsx` | Main messages page: layout + state orchestration |
| `src/app/(user)/messages/layout.tsx` | Minimal layout (remove default padding/max-width) |
| `src/app/(user)/messages/_components/conversation-list.tsx` | Left panel: search + tabs + conversation items |
| `src/app/(user)/messages/_components/conversation-item.tsx` | Single row: avatar, name, last msg, time, unread |
| `src/app/(user)/messages/_components/chat-view.tsx` | Right panel: header + messages + input |
| `src/app/(user)/messages/_components/chat-header.tsx` | Chat header: back button, avatar, name |
| `src/app/(user)/messages/_components/message-list.tsx` | Scrollable bubble list with date separators |
| `src/app/(user)/messages/_components/message-bubble.tsx` | Single chat bubble (sent/received variants) |
| `src/app/(user)/messages/_components/message-input.tsx` | Text input + attach + send button |
| `src/app/(user)/messages/_components/admin-chat-view.tsx` | Support tab: polling-based chat with AdminChat table |
| `src/app/(user)/messages/_components/date-separator.tsx` | "Today", "Yesterday", "Apr 14" divider |
| `src/app/(user)/messages/_components/empty-state.tsx` | Empty conversation placeholder |

### Modified Files

| File | Change |
|---|---|
| `package.json` | Add `@twilio/conversations` and `twilio` dependencies |

---

## Task 1: Install Dependencies and Create Twilio API Key

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Twilio packages**

```bash
cd ~/Library/CloudStorage/GoogleDrive-ac@adesign.es/Mi\ unidad/Show\ United/admin-dashboard
npm install @twilio/conversations twilio
```

Expected: Both packages added to `dependencies` in package.json.

- [ ] **Step 2: Create a new Twilio API Key for token generation**

```bash
curl -s -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Keys.json" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
  -d "FriendlyName=WebAppChatKey" | python3 -m json.tool
```

Expected: Response with `sid` (starts with `SK...`) and `secret`. **Save both values** — the secret is only shown once.

- [ ] **Step 3: Add Twilio env vars to `.env.local`**

Open `.env.local` and add (replacing `SK...` and `secret_value` with values from Step 2):

```
TWILIO_ACCOUNT_SID=<from .env.local>
TWILIO_AUTH_TOKEN=<from .env.local>
TWILIO_API_KEY_SID=<from .env.local>
TWILIO_API_KEY_SECRET=<from .env.local>
TWILIO_CONVERSATIONS_SERVICE_SID=<from .env.local>
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(chat): add twilio dependencies"
```

Note: Do NOT commit `.env.local`.

---

## Task 2: API Route — Chat Token Generation

**Files:**
- Create: `src/app/api/user/chat-token/route.ts`

- [ ] **Step 1: Create the chat-token API route**

```typescript
// src/app/api/user/chat-token/route.ts
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
        ttl: 3600, // 1 hour
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
```

- [ ] **Step 2: Test the endpoint manually**

Start the dev server and test with curl (replace `YOUR_JWT` with a real user JWT from the browser localStorage):

```bash
curl -s -X POST http://localhost:3000/api/user/chat-token \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_JWT"}' | python3 -m json.tool
```

Expected: Response with `twilioToken`, `identity` (e.g. `Individual_118`), `userId`, `userType`, `serviceSid`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/user/chat-token/route.ts
git commit -m "feat(chat): add Twilio token generation API route"
```

---

## Task 3: API Route — Chat Users (Name/Photo Resolution)

**Files:**
- Create: `src/app/api/user/chat-users/route.ts`

- [ ] **Step 1: Create the chat-users API route**

```typescript
// src/app/api/user/chat-users/route.ts
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

    // Parse identities into type+id pairs
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

    // Fetch individual users
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

    // Fetch company users
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
```

- [ ] **Step 2: Test the endpoint**

```bash
curl -s -X POST http://localhost:3000/api/user/chat-users \
  -H "Content-Type: application/json" \
  -d '{"token":"x","identities":["Individual_114","Individual_118","Company_42"]}' | python3 -m json.tool
```

Expected: JSON with `users` map containing names and photo URLs.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/user/chat-users/route.ts
git commit -m "feat(chat): add chat-users API route for name/photo resolution"
```

---

## Task 4: API Route — Chat Create (New Conversation)

**Files:**
- Create: `src/app/api/user/chat-create/route.ts`

- [ ] **Step 1: Create the chat-create API route**

```typescript
// src/app/api/user/chat-create/route.ts
import { NextResponse } from 'next/server';
import twilio from 'twilio';

const {
  TWILIO_ACCOUNT_SID = '',
  TWILIO_AUTH_TOKEN = '',
  TWILIO_CONVERSATIONS_SERVICE_SID = '',
} = process.env;

function extractUserFromToken(jwtToken: string): {
  identity: string;
} | null {
  try {
    const payload = JSON.parse(atob(jwtToken.split('.')[1]));
    const individualId = payload.IndividualUserId;
    const companyId = payload.CompanyUserId;
    if (individualId) return { identity: `Individual_${individualId}` };
    if (companyId) return { identity: `Company_${companyId}` };
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

    // Try to find existing conversation
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

    // Create new conversation
    const friendlyName = `Chat ${user.identity} & ${targetIdentity}`;
    const conversation = await conversationsClient
      .conversations
      .create({
        uniqueName,
        friendlyName,
      });

    // Add both participants
    await conversationsClient
      .conversations(conversation.sid)
      .participants
      .create({ identity: user.identity });

    await conversationsClient
      .conversations(conversation.sid)
      .participants
      .create({ identity: targetIdentity });

    return NextResponse.json({
      conversationSid: conversation.sid,
      isNew: true,
    });
  } catch (error: any) {
    console.error('Chat create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/user/chat-create/route.ts
git commit -m "feat(chat): add chat-create API route for new conversations"
```

---

## Task 5: API Route — Admin Chat (Support)

**Files:**
- Create: `src/app/api/user/admin-chat/route.ts`

- [ ] **Step 1: Create the admin-chat API route**

```typescript
// src/app/api/user/admin-chat/route.ts
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

// GET — list admin chat messages for current user
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

    // Count total
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

// POST — send a message in admin chat (from user side)
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const token = formData.get('token') as string;
    const message = formData.get('ChatMessage') as string;
    const imageFile = formData.get('LogoFile') as File | null;

    if (!token || !message) {
      return NextResponse.json({ error: 'Token and message required' }, { status: 400 });
    }

    const user = extractUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const db = await getDb();

    // For now, store image URL as empty string (image upload to api.showunited.com not implemented)
    const imageUrl = '';

    const userColumn = user.userType === 'Individual' ? 'IndividualUserId' : 'CompanyUserId';

    const result = await db.request()
      .input('userId', sql.Int, user.userId)
      .input('message', sql.NVarChar(sql.MAX), message)
      .input('image', sql.NVarChar(500), imageUrl)
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/user/admin-chat/route.ts
git commit -m "feat(chat): add admin-chat API route for support messages"
```

---

## Task 6: Twilio Client Wrapper (Client-Side)

**Files:**
- Create: `src/lib/twilio-chat.ts`

- [ ] **Step 1: Create the Twilio chat client wrapper**

```typescript
// src/lib/twilio-chat.ts
'use client';

import { Client, Conversation, Message, Participant } from '@twilio/conversations';

let clientInstance: Client | null = null;
let currentIdentity: string | null = null;

export async function initTwilioClient(
  twilioToken: string,
  identity: string,
  onTokenExpiring: () => Promise<string>
): Promise<Client> {
  // Reuse existing client if same identity
  if (clientInstance && currentIdentity === identity) {
    return clientInstance;
  }

  // Shut down old client
  if (clientInstance) {
    await clientInstance.shutdown();
    clientInstance = null;
  }

  const client = new Client(twilioToken);
  currentIdentity = identity;

  // Wait for initialization
  await new Promise<void>((resolve, reject) => {
    client.on('initialized', () => resolve());
    client.on('initFailed', ({ error }) =>
      reject(new Error(`Twilio init failed: ${error?.message}`))
    );
  });

  // Auto-refresh token
  client.on('tokenAboutToExpire', async () => {
    try {
      const newToken = await onTokenExpiring();
      await client.updateToken(newToken);
    } catch (err) {
      console.error('Failed to refresh Twilio token:', err);
    }
  });

  client.on('tokenExpired', async () => {
    try {
      const newToken = await onTokenExpiring();
      await client.updateToken(newToken);
    } catch (err) {
      console.error('Failed to refresh expired Twilio token:', err);
    }
  });

  clientInstance = client;
  return client;
}

export function getTwilioClient(): Client | null {
  return clientInstance;
}

export async function shutdownTwilioClient(): Promise<void> {
  if (clientInstance) {
    await clientInstance.shutdown();
    clientInstance = null;
    currentIdentity = null;
  }
}

// Re-export types for convenience
export type { Client, Conversation, Message, Participant };
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/twilio-chat.ts
git commit -m "feat(chat): add Twilio client-side wrapper with token auto-refresh"
```

---

## Task 7: UI — Small Components (Bubble, DateSeparator, EmptyState, Header)

**Files:**
- Create: `src/app/(user)/messages/_components/message-bubble.tsx`
- Create: `src/app/(user)/messages/_components/date-separator.tsx`
- Create: `src/app/(user)/messages/_components/empty-state.tsx`
- Create: `src/app/(user)/messages/_components/chat-header.tsx`

- [ ] **Step 1: Create message-bubble component**

```typescript
// src/app/(user)/messages/_components/message-bubble.tsx
'use client';

import dayjs from 'dayjs';

interface MessageBubbleProps {
  body: string;
  timestamp: string | Date;
  isMine: boolean;
  showTail?: boolean;
}

export default function MessageBubble({
  body,
  timestamp,
  isMine,
  showTail = true,
}: MessageBubbleProps) {
  const time = dayjs(timestamp).format('h:mm A');

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-[75%] px-3.5 py-2 ${
          isMine
            ? `bg-[#E85D5D] text-white ${showTail ? 'rounded-2xl rounded-br-md' : 'rounded-2xl'}`
            : `bg-[#F0F0F0] text-gray-900 ${showTail ? 'rounded-2xl rounded-bl-md' : 'rounded-2xl'}`
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
          {body}
        </p>
        <p
          className={`mt-0.5 text-[11px] ${
            isMine ? 'text-white/70' : 'text-gray-400'
          } text-right`}
        >
          {time}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create date-separator component**

```typescript
// src/app/(user)/messages/_components/date-separator.tsx
'use client';

import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';

dayjs.extend(isToday);
dayjs.extend(isYesterday);

interface DateSeparatorProps {
  date: string | Date;
}

export default function DateSeparator({ date }: DateSeparatorProps) {
  const d = dayjs(date);
  let label: string;

  if (d.isToday()) {
    label = 'Today';
  } else if (d.isYesterday()) {
    label = 'Yesterday';
  } else if (d.year() === dayjs().year()) {
    label = d.format('MMM D');
  } else {
    label = d.format('MMM D, YYYY');
  }

  return (
    <div className="flex items-center justify-center py-3">
      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
        {label}
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Create empty-state component**

```typescript
// src/app/(user)/messages/_components/empty-state.tsx
'use client';

import { PiChatCircleDots } from 'react-icons/pi';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export default function EmptyState({
  title = 'No messages yet',
  description = 'Start a conversation from a user profile',
}: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <PiChatCircleDots className="h-16 w-16 text-gray-200" />
      <p className="text-lg font-medium text-gray-400">{title}</p>
      <p className="text-sm text-gray-300">{description}</p>
    </div>
  );
}
```

- [ ] **Step 4: Create chat-header component**

```typescript
// src/app/(user)/messages/_components/chat-header.tsx
'use client';

import { PiArrowLeftBold } from 'react-icons/pi';
import { Avatar } from 'rizzui';

interface ChatHeaderProps {
  name: string;
  photo: string;
  onBack: () => void;
}

export default function ChatHeader({ name, photo, onBack }: ChatHeaderProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
      <button
        onClick={onBack}
        className="rounded-lg p-1.5 text-[#E85D5D] transition-colors hover:bg-gray-100 lg:hidden"
      >
        <PiArrowLeftBold className="h-5 w-5" />
      </button>
      <Avatar
        name={name}
        src={photo || undefined}
        initials={initials}
        className="!h-10 !w-10 bg-gray-200"
      />
      <span className="text-base font-semibold text-gray-900">{name}</span>
    </header>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(user\)/messages/_components/message-bubble.tsx \
  src/app/\(user\)/messages/_components/date-separator.tsx \
  src/app/\(user\)/messages/_components/empty-state.tsx \
  src/app/\(user\)/messages/_components/chat-header.tsx
git commit -m "feat(chat): add bubble, date separator, empty state, header components"
```

---

## Task 8: UI — MessageInput Component

**Files:**
- Create: `src/app/(user)/messages/_components/message-input.tsx`

- [ ] **Step 1: Create message-input component**

```typescript
// src/app/(user)/messages/_components/message-input.tsx
'use client';

import { useRef, useState } from 'react';
import { PiPaperclipLight, PiPaperPlaneRightFill } from 'react-icons/pi';

interface MessageInputProps {
  onSend: (text: string) => void;
  onAttach?: (file: File) => void;
  disabled?: boolean;
}

export default function MessageInput({
  onSend,
  onAttach,
  disabled = false,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    // Auto-grow textarea
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && onAttach) {
      onAttach(file);
    }
    // Reset file input
    e.target.value = '';
  }

  const hasText = text.trim().length > 0;

  return (
    <div className="border-t border-gray-200 bg-white px-3 py-2.5">
      <div className="flex items-end gap-2">
        {/* Text input */}
        <div className="relative flex flex-1 items-end rounded-full border border-gray-200 bg-gray-50 px-4 py-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Message"
            rows={1}
            disabled={disabled}
            className="max-h-[120px] w-full resize-none bg-transparent text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:opacity-50"
          />
          {/* Attach button */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={disabled}
            className="ml-2 flex-shrink-0 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
          >
            <PiPaperclipLight className="h-5 w-5" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!hasText || disabled}
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all ${
            hasText && !disabled
              ? 'bg-[#E85D5D] text-white shadow-sm hover:bg-[#D14D4D]'
              : 'bg-[#E85D5D]/40 text-white/70'
          }`}
        >
          <PiPaperPlaneRightFill className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(user\)/messages/_components/message-input.tsx
git commit -m "feat(chat): add message input component with attach and send"
```

---

## Task 9: UI — MessageList (Scrollable Bubbles with Date Separators)

**Files:**
- Create: `src/app/(user)/messages/_components/message-list.tsx`

- [ ] **Step 1: Create message-list component**

```typescript
// src/app/(user)/messages/_components/message-list.tsx
'use client';

import { useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import MessageBubble from './message-bubble';
import DateSeparator from './date-separator';
import { Loader } from 'rizzui';

export interface ChatMessage {
  sid: string;
  body: string;
  author: string;
  dateCreated: string | Date;
}

interface MessageListProps {
  messages: ChatMessage[];
  currentIdentity: string;
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export default function MessageList({
  messages,
  currentIdentity,
  loading = false,
  onLoadMore,
  hasMore = false,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  // Initial scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [currentIdentity]);

  // Scroll-to-top detection for loading more
  function handleScroll() {
    if (!containerRef.current || !onLoadMore || !hasMore || loading) return;
    if (containerRef.current.scrollTop < 50) {
      onLoadMore();
    }
  }

  // Group messages and insert date separators
  function renderMessages() {
    const elements: React.ReactNode[] = [];
    let lastDate = '';
    let lastAuthor = '';

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const msgDate = dayjs(msg.dateCreated).format('YYYY-MM-DD');
      const isMine = msg.author === currentIdentity;
      const isLastInGroup =
        i === messages.length - 1 || messages[i + 1].author !== msg.author;

      // Date separator
      if (msgDate !== lastDate) {
        elements.push(<DateSeparator key={`date-${msgDate}`} date={msg.dateCreated} />);
        lastDate = msgDate;
        lastAuthor = '';
      }

      // Spacing between different authors
      const sameAuthor = msg.author === lastAuthor;

      elements.push(
        <div key={msg.sid} className={sameAuthor ? 'mt-0.5' : 'mt-3 first:mt-0'}>
          <MessageBubble
            body={msg.body}
            timestamp={msg.dateCreated}
            isMine={isMine}
            showTail={isLastInGroup}
          />
        </div>
      );

      lastAuthor = msg.author;
    }

    return elements;
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="custom-scrollbar flex-1 overflow-y-auto px-4 py-3"
    >
      {loading && (
        <div className="flex justify-center py-4">
          <Loader variant="spinner" size="sm" />
        </div>
      )}

      {hasMore && !loading && (
        <button
          onClick={onLoadMore}
          className="mb-3 w-full text-center text-sm text-gray-400 hover:text-gray-600"
        >
          Load earlier messages
        </button>
      )}

      {renderMessages()}
      <div ref={bottomRef} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(user\)/messages/_components/message-list.tsx
git commit -m "feat(chat): add message list with date separators and auto-scroll"
```

---

## Task 10: UI — ConversationItem and ConversationList

**Files:**
- Create: `src/app/(user)/messages/_components/conversation-item.tsx`
- Create: `src/app/(user)/messages/_components/conversation-list.tsx`

- [ ] **Step 1: Create conversation-item component**

```typescript
// src/app/(user)/messages/_components/conversation-item.tsx
'use client';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Avatar, Badge } from 'rizzui';

dayjs.extend(relativeTime);

interface ConversationItemProps {
  name: string;
  photo: string;
  lastMessage: string;
  lastMessageTime: string | Date | null;
  unreadCount: number;
  isActive: boolean;
  onClick: () => void;
}

export default function ConversationItem({
  name,
  photo,
  lastMessage,
  lastMessageTime,
  unreadCount,
  isActive,
  onClick,
}: ConversationItemProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  function formatTime(time: string | Date | null): string {
    if (!time) return '';
    const d = dayjs(time);
    const now = dayjs();
    if (d.isSame(now, 'day')) return d.format('h:mm A');
    if (d.isSame(now.subtract(1, 'day'), 'day')) return 'Yesterday';
    if (d.isSame(now, 'year')) return d.format('MMM D');
    return d.format('MM/DD/YY');
  }

  return (
    <div
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${
        isActive ? 'border-l-[3px] border-l-[#E85D5D] bg-gray-50' : ''
      }`}
    >
      <Avatar
        name={name}
        src={photo || undefined}
        initials={initials}
        className="!h-12 !w-12 flex-shrink-0 bg-gray-200"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="truncate text-sm font-semibold text-gray-900">
            {name}
          </span>
          <span className="ml-2 flex-shrink-0 text-xs text-gray-400">
            {formatTime(lastMessageTime)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between">
          <p className="truncate text-sm text-gray-500">{lastMessage || 'No messages yet'}</p>
          {unreadCount > 0 && (
            <Badge className="ml-2 flex-shrink-0 !bg-[#E85D5D] !text-white" size="sm">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create conversation-list component**

```typescript
// src/app/(user)/messages/_components/conversation-list.tsx
'use client';

import { useState } from 'react';
import { PiMagnifyingGlassLight } from 'react-icons/pi';
import ConversationItem from './conversation-item';
import EmptyState from './empty-state';
import { Loader } from 'rizzui';

export interface ConversationData {
  sid: string;
  name: string;
  photo: string;
  lastMessage: string;
  lastMessageTime: string | Date | null;
  unreadCount: number;
}

interface ConversationListProps {
  conversations: ConversationData[];
  activeConversationSid: string | null;
  onSelect: (sid: string) => void;
  activeTab: 'chats' | 'support';
  onTabChange: (tab: 'chats' | 'support') => void;
  loading?: boolean;
}

export default function ConversationList({
  conversations,
  activeConversationSid,
  onSelect,
  activeTab,
  onTabChange,
  loading = false,
}: ConversationListProps) {
  const [search, setSearch] = useState('');

  const filtered = search
    ? conversations.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  return (
    <div className="flex h-full flex-col border-r border-gray-200 bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 pb-3 pt-4">
        <h1 className="mb-3 text-xl font-bold text-gray-900">Messages</h1>

        {/* Search */}
        <div className="relative">
          <PiMagnifyingGlassLight className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Company, Name..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-gray-300 focus:outline-none"
          />
        </div>

        {/* Tabs */}
        <div className="mt-3 flex gap-1 rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => onTabChange('chats')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'chats'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Chats
          </button>
          <button
            onClick={() => onTabChange('support')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'support'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Support
          </button>
        </div>
      </div>

      {/* Conversation list */}
      <div className="custom-scrollbar flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader variant="spinner" size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? 'No results' : 'No conversations'}
            description={search ? 'Try a different search' : 'Start a conversation from a user profile'}
          />
        ) : (
          filtered.map((conv) => (
            <ConversationItem
              key={conv.sid}
              name={conv.name}
              photo={conv.photo}
              lastMessage={conv.lastMessage}
              lastMessageTime={conv.lastMessageTime}
              unreadCount={conv.unreadCount}
              isActive={conv.sid === activeConversationSid}
              onClick={() => onSelect(conv.sid)}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(user\)/messages/_components/conversation-item.tsx \
  src/app/\(user\)/messages/_components/conversation-list.tsx
git commit -m "feat(chat): add conversation list and item components"
```

---

## Task 11: UI — ChatView (Twilio-Connected Chat Panel)

**Files:**
- Create: `src/app/(user)/messages/_components/chat-view.tsx`

- [ ] **Step 1: Create chat-view component**

```typescript
// src/app/(user)/messages/_components/chat-view.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Conversation, Message } from '@twilio/conversations';
import ChatHeader from './chat-header';
import MessageList, { ChatMessage } from './message-list';
import MessageInput from './message-input';
import EmptyState from './empty-state';
import { Loader } from 'rizzui';

interface ChatViewProps {
  conversation: Conversation | null;
  currentIdentity: string;
  contactName: string;
  contactPhoto: string;
  onBack: () => void;
  loading?: boolean;
}

export default function ChatView({
  conversation,
  currentIdentity,
  contactName,
  contactPhoto,
  onBack,
  loading = false,
}: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const pageSizeRef = useRef(30);
  const anchorRef = useRef<number | undefined>(undefined);

  // Load messages when conversation changes
  useEffect(() => {
    if (!conversation) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    async function loadMessages() {
      setLoadingMessages(true);
      try {
        const paginator = await conversation!.getMessages(pageSizeRef.current);
        if (cancelled) return;

        const msgs: ChatMessage[] = paginator.items.map((m: Message) => ({
          sid: m.sid,
          body: m.body || '',
          author: m.author || '',
          dateCreated: m.dateCreated || new Date(),
        }));

        setMessages(msgs);
        setHasMore(paginator.hasPrevPage);
        anchorRef.current = paginator.items[0]?.index;

        // Mark all as read
        await conversation!.setAllMessagesRead();
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    }

    loadMessages();

    // Listen for new messages
    function handleMessageAdded(message: Message) {
      setMessages((prev) => [
        ...prev,
        {
          sid: message.sid,
          body: message.body || '',
          author: message.author || '',
          dateCreated: message.dateCreated || new Date(),
        },
      ]);
      // Mark as read
      conversation!.setAllMessagesRead().catch(() => {});
    }

    conversation.on('messageAdded', handleMessageAdded);

    return () => {
      cancelled = true;
      conversation.off('messageAdded', handleMessageAdded);
    };
  }, [conversation]);

  // Load more (older messages)
  const loadMore = useCallback(async () => {
    if (!conversation || !hasMore || loadingMessages) return;
    setLoadingMessages(true);
    try {
      const paginator = await conversation.getMessages(
        pageSizeRef.current,
        anchorRef.current ? anchorRef.current - 1 : undefined,
        'backwards'
      );

      const olderMsgs: ChatMessage[] = paginator.items.map((m: Message) => ({
        sid: m.sid,
        body: m.body || '',
        author: m.author || '',
        dateCreated: m.dateCreated || new Date(),
      }));

      setMessages((prev) => [...olderMsgs, ...prev]);
      setHasMore(paginator.hasPrevPage);
      anchorRef.current = paginator.items[0]?.index;
    } catch (err) {
      console.error('Failed to load more messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [conversation, hasMore, loadingMessages]);

  // Send message
  async function handleSend(text: string) {
    if (!conversation) return;
    try {
      await conversation.sendMessage(text);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  }

  // Send attachment
  async function handleAttach(file: File) {
    if (!conversation) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      await conversation.sendMessage(formData);
    } catch (err) {
      console.error('Failed to send attachment:', err);
    }
  }

  if (!conversation && !loading) {
    return (
      <div className="flex h-full flex-col">
        <EmptyState
          title="Select a conversation"
          description="Choose a conversation from the list to start chatting"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader variant="spinner" size="xl" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ChatHeader name={contactName} photo={contactPhoto} onBack={onBack} />

      <MessageList
        messages={messages}
        currentIdentity={currentIdentity}
        loading={loadingMessages}
        onLoadMore={loadMore}
        hasMore={hasMore}
      />

      <MessageInput
        onSend={handleSend}
        onAttach={handleAttach}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(user\)/messages/_components/chat-view.tsx
git commit -m "feat(chat): add ChatView component with Twilio message loading and sending"
```

---

## Task 12: UI — AdminChatView (Support Tab)

**Files:**
- Create: `src/app/(user)/messages/_components/admin-chat-view.tsx`

- [ ] **Step 1: Create admin-chat-view component**

```typescript
// src/app/(user)/messages/_components/admin-chat-view.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import ChatHeader from './chat-header';
import MessageList, { ChatMessage } from './message-list';
import MessageInput from './message-input';
import EmptyState from './empty-state';
import { Loader } from 'rizzui';

interface AdminChatViewProps {
  token: string;
  currentIdentity: string;
  onBack: () => void;
}

export default function AdminChatView({
  token,
  currentIdentity,
  onBack,
}: AdminChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const pageRef = useRef(1);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = useCallback(async (page: number, append = false) => {
    try {
      const res = await axios.get('/api/user/admin-chat', {
        params: { token, page },
      });
      const data = res.data;

      const msgs: ChatMessage[] = (data.messages || []).map((m: any) => ({
        sid: `admin-${m.id}`,
        body: m.message || '',
        author: m.isSentByAdmin ? 'admin' : currentIdentity,
        dateCreated: m.createdAt,
      }));

      if (append) {
        setMessages((prev) => [...prev, ...msgs]);
      } else {
        setMessages(msgs);
      }
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Failed to fetch admin chat:', err);
    } finally {
      setLoading(false);
    }
  }, [token, currentIdentity]);

  // Initial load
  useEffect(() => {
    fetchMessages(1);

    // Poll every 10 seconds
    pollRef.current = setInterval(() => {
      fetchMessages(1);
    }, 10000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  async function handleSend(text: string) {
    try {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('ChatMessage', text);

      await axios.post('/api/user/admin-chat', formData);

      // Refresh messages
      await fetchMessages(1);
    } catch (err) {
      console.error('Failed to send admin chat:', err);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader variant="spinner" size="xl" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ChatHeader
        name="Show United Support"
        photo="/logo-showunited.png"
        onBack={onBack}
      />

      {messages.length === 0 ? (
        <div className="flex-1">
          <EmptyState
            title="No support messages"
            description="Send a message to contact the admin team"
          />
        </div>
      ) : (
        <MessageList
          messages={messages}
          currentIdentity={currentIdentity}
        />
      )}

      <MessageInput onSend={handleSend} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(user\)/messages/_components/admin-chat-view.tsx
git commit -m "feat(chat): add AdminChatView component with polling"
```

---

## Task 13: Main Messages Page (Orchestration)

**Files:**
- Create: `src/app/(user)/messages/layout.tsx`
- Create: `src/app/(user)/messages/page.tsx`

- [ ] **Step 1: Create messages layout**

```typescript
// src/app/(user)/messages/layout.tsx
export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Create the main messages page**

```typescript
// src/app/(user)/messages/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Loader } from 'rizzui';
import {
  initTwilioClient,
  shutdownTwilioClient,
} from '@/lib/twilio-chat';
import type { Client, Conversation, Participant } from '@twilio/conversations';
import ConversationList, {
  ConversationData,
} from './_components/conversation-list';
import ChatView from './_components/chat-view';
import AdminChatView from './_components/admin-chat-view';

// User info cache: identity → { name, photo }
type UserInfo = { name: string; photo: string; type: string };
const userCache = new Map<string, UserInfo>();

export default function MessagesPage() {
  const [token, setToken] = useState('');
  const [identity, setIdentity] = useState('');
  const [twilioClient, setTwilioClient] = useState<Client | null>(null);
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [activeConvSid, setActiveConvSid] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [activeTab, setActiveTab] = useState<'chats' | 'support'>('chats');
  const [loading, setLoading] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhoto, setContactPhoto] = useState('');

  // Read token from localStorage
  useEffect(() => {
    setToken(localStorage.getItem('su_register_token') || '');
  }, []);

  // Fetch Twilio token
  const fetchTwilioToken = useCallback(async (): Promise<string> => {
    const res = await axios.post('/api/user/chat-token', { token });
    return res.data.twilioToken;
  }, [token]);

  // Resolve user identities to names/photos
  async function resolveUsers(identities: string[]): Promise<void> {
    const uncached = identities.filter((id) => !userCache.has(id));
    if (uncached.length === 0) return;

    try {
      const res = await axios.post('/api/user/chat-users', {
        token,
        identities: uncached,
      });
      const users = res.data.users || {};
      for (const [identity, info] of Object.entries(users)) {
        userCache.set(identity, info as UserInfo);
      }
    } catch (err) {
      console.error('Failed to resolve users:', err);
    }
  }

  // Get contact identity from a conversation (the other participant)
  function getContactIdentity(conv: Conversation): string {
    // Twilio SDK stores participants, but we can derive from unique_name
    const uniqueName = conv.uniqueName || '';
    const match = uniqueName.match(
      /^chat_(Individual_\d+|Company_\d+)_(Individual_\d+|Company_\d+)$/
    );
    if (match) {
      const [, a, b] = match;
      return a === identity ? b : a;
    }
    return '';
  }

  // Build conversation data for the list
  async function buildConversationData(
    conv: Conversation
  ): Promise<ConversationData> {
    const contactId = getContactIdentity(conv);
    const userInfo = userCache.get(contactId) || {
      name: contactId,
      photo: '',
      type: '',
    };

    let lastMessage = '';
    let lastMessageTime: Date | null = null;

    try {
      const msgs = await conv.getMessages(1);
      if (msgs.items.length > 0) {
        lastMessage = msgs.items[0].body || '';
        lastMessageTime = msgs.items[0].dateCreated || null;
      }
    } catch { /* empty conversation */ }

    const unreadCount = await conv.getUnreadMessagesCount() ?? 0;

    return {
      sid: conv.sid,
      name: userInfo.name,
      photo: userInfo.photo,
      lastMessage,
      lastMessageTime,
      unreadCount: typeof unreadCount === 'number' ? unreadCount : 0,
    };
  }

  // Initialize Twilio client and load conversations
  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function init() {
      try {
        // Get Twilio token
        const res = await axios.post('/api/user/chat-token', { token });
        const { twilioToken, identity: userIdentity } = res.data;
        setIdentity(userIdentity);

        // Init Twilio client
        const client = await initTwilioClient(
          twilioToken,
          userIdentity,
          fetchTwilioToken
        );
        if (cancelled) return;
        setTwilioClient(client);

        // Load subscribed conversations
        const paginator = await client.getSubscribedConversations();
        const convs = paginator.items;

        // Resolve all contact identities
        const contactIds = convs
          .map((c) => {
            const un = c.uniqueName || '';
            const match = un.match(
              /^chat_(Individual_\d+|Company_\d+)_(Individual_\d+|Company_\d+)$/
            );
            if (match) {
              const [, a, b] = match;
              return a === userIdentity ? b : a;
            }
            return '';
          })
          .filter(Boolean);

        await resolveUsers(contactIds);

        // Build conversation data
        const convDataPromises = convs.map((c) => buildConversationData(c));
        const convData = await Promise.all(convDataPromises);

        // Sort by last message time (newest first)
        convData.sort((a, b) => {
          const ta = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
          const tb = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
          return tb - ta;
        });

        if (!cancelled) {
          setConversations(convData);
          setLoading(false);
        }

        // Listen for real-time updates
        client.on('messageAdded', async (message) => {
          const convSid = message.conversation.sid;
          // Update conversation in list
          setConversations((prev) => {
            const updated = prev.map((c) => {
              if (c.sid === convSid) {
                return {
                  ...c,
                  lastMessage: message.body || '',
                  lastMessageTime: message.dateCreated || new Date(),
                  unreadCount: convSid === activeConvSid ? 0 : c.unreadCount + 1,
                };
              }
              return c;
            });
            // Re-sort by last message time
            updated.sort((a, b) => {
              const ta = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
              const tb = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
              return tb - ta;
            });
            return updated;
          });
        });

        // New conversation joined
        client.on('conversationJoined', async (conv) => {
          const contactId = getContactIdentity(conv);
          await resolveUsers([contactId]);
          const data = await buildConversationData(conv);
          setConversations((prev) => [data, ...prev]);
        });
      } catch (err) {
        console.error('Failed to initialize chat:', err);
        if (!cancelled) setLoading(false);
      }
    }

    init();

    return () => {
      cancelled = true;
      shutdownTwilioClient();
    };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle conversation selection
  async function handleSelectConversation(sid: string) {
    setActiveConvSid(sid);
    setLoadingChat(true);

    try {
      const conv = await twilioClient!.getConversationBySid(sid);
      setActiveConversation(conv);

      const contactId = getContactIdentity(conv);
      const info = userCache.get(contactId);
      setContactName(info?.name || contactId);
      setContactPhoto(info?.photo || '');

      // Mark as read and update list
      setConversations((prev) =>
        prev.map((c) => (c.sid === sid ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error('Failed to open conversation:', err);
    } finally {
      setLoadingChat(false);
    }
  }

  function handleBack() {
    setActiveConvSid(null);
    setActiveConversation(null);
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-60px)] items-center justify-center">
        <Loader variant="spinner" size="xl" />
      </div>
    );
  }

  // Mobile: show either list or chat
  const showChatOnMobile = activeConvSid !== null || activeTab === 'support';

  return (
    <div className="flex h-[calc(100vh-60px)] overflow-hidden md:h-[calc(100vh-72px)]">
      {/* Conversation list — hidden on mobile when chat is open */}
      <div
        className={`w-full flex-shrink-0 lg:block lg:w-[350px] ${
          showChatOnMobile ? 'hidden' : 'block'
        }`}
      >
        <ConversationList
          conversations={conversations}
          activeConversationSid={activeConvSid}
          onSelect={handleSelectConversation}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          loading={loading}
        />
      </div>

      {/* Chat view — hidden on mobile when list is shown */}
      <div
        className={`min-w-0 flex-1 ${
          showChatOnMobile ? 'block' : 'hidden lg:block'
        }`}
      >
        {activeTab === 'chats' ? (
          <ChatView
            conversation={activeConversation}
            currentIdentity={identity}
            contactName={contactName}
            contactPhoto={contactPhoto}
            onBack={handleBack}
            loading={loadingChat}
          />
        ) : (
          <AdminChatView
            token={token}
            currentIdentity={identity}
            onBack={() => setActiveTab('chats')}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify the dev server runs without errors**

```bash
cd ~/Library/CloudStorage/GoogleDrive-ac@adesign.es/Mi\ unidad/Show\ United/admin-dashboard
npm run dev
```

Open `http://localhost:3000/messages` in the browser. Expected: loading spinner, then conversation list loads with real Twilio data.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(user\)/messages/layout.tsx src/app/\(user\)/messages/page.tsx
git commit -m "feat(chat): add main Messages page with Twilio integration"
```

---

## Task 14: End-to-End Testing and Polish

- [ ] **Step 1: Test peer-to-peer chat flow**

1. Open `http://localhost:3000/messages` — verify conversation list loads
2. Click on a conversation — verify messages load with correct bubbles (coral for sent, gray for received)
3. Type a message and send — verify it appears as a coral bubble
4. Verify the message appears in the iOS app (ask the user to check)

- [ ] **Step 2: Test support tab**

1. Click "Support" tab — verify it loads admin chat messages (may be empty)
2. Send a message — verify it appears in the chat
3. Switch back to "Chats" tab — verify conversations still work

- [ ] **Step 3: Test mobile responsive**

1. Resize browser to mobile width (<1024px)
2. Verify only conversation list shows
3. Click a conversation — verify list hides and chat shows
4. Click Back — verify returns to list

- [ ] **Step 4: Fix any issues found during testing**

Address any bugs, styling adjustments, or edge cases discovered during testing.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(chat): complete Messages feature with Twilio p2p + admin support"
```

---

## Task 15: Deploy

- [ ] **Step 1: Add Twilio env vars to production**

SSH into the VPS and add the env vars to the container or `.env.production`:

```bash
ssh root@178.104.122.244
cd /path/to/showunited-webapp
# Add to .env or docker-compose environment
```

Required env vars:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_API_KEY_SID`
- `TWILIO_API_KEY_SECRET`
- `TWILIO_CONVERSATIONS_SERVICE_SID`

- [ ] **Step 2: Deploy using manual Docker build**

```bash
# On VPS
git clone https://aleinco:$GITHUB_TOKEN@github.com/aleinco/showunited-webapp.git /tmp/su-build
cd /tmp/su-build
docker build -t showunited-webapp .
docker stop showunited-webapp-container || true
docker rm showunited-webapp-container || true
docker run -d --name showunited-webapp-container \
  --network coolify \
  -p 3000:3000 \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.showunited.rule=Host(\`app.showunited.com\`)" \
  showunited-webapp
```

- [ ] **Step 3: Verify production**

Open `https://app.showunited.com/messages` and verify chat works.

- [ ] **Step 4: Commit and push**

```bash
git push origin main
```
