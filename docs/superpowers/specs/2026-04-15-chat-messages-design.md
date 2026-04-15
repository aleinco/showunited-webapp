# Chat/Messages — Design Spec

**Date:** 2026-04-15
**Status:** Draft
**Author:** Claude (with Alain)

## Overview

Implement a full Chat/Messages section in the Show United webapp (app.showunited.com) with two subsystems:

1. **Peer-to-peer chat** — Real-time messaging between users via Twilio Conversations SDK (compatible with iOS/Android apps)
2. **Admin support chat** — Direct messaging between users and platform admins via SQL Server (table `AdminChat`)

The UI follows the iOS app design: conversation list (WhatsApp-style) + individual chat view with coral/red bubbles.

## Architecture

### Two Systems, One Interface

```
/messages (user route, already defined in sidebar)
├── ConversationList (left panel desktop / main view mobile)
│   ├── SearchBar ("Company, Name...")
│   ├── Tabs: "Chats" | "Support"
│   └── ConversationItem[] (avatar, name, last msg, time, unread badge)
│
└── ChatView (right panel desktop / detail view mobile)
    ├── ChatHeader (avatar, name, back button)
    ├── MessageList (bubbles with infinite scroll)
    │   ├── SentBubble (coral/red, right-aligned, with timestamp)
    │   └── ReceivedBubble (light gray, left-aligned, with timestamp)
    └── MessageInput (text input + attach clip + red send button)
```

### Data Flow

**Tab "Chats" (peer-to-peer via Twilio):**

1. Page mounts → `POST /api/user/chat-token` generates Twilio JWT
2. Twilio JS SDK (`@twilio/conversations`) connects with the token
3. SDK loads user's conversations via `client.getSubscribedConversations()`
4. Click on conversation → SDK loads messages in real-time
5. Send message → `conversation.sendMessage(text)` → Twilio delivers to iOS/Android
6. User names/photos → `POST /api/user/chat-users` queries SQL Server
7. Token refresh → `client.on('tokenAboutToExpire')` → auto-refresh

**Tab "Support" (admin chat via SQL):**

1. `GET /api/user/admin-chat?page=1` → SQL query on `AdminChat` table
2. Send → `POST /api/user/admin-chat` → INSERT into `AdminChat` with `IsSentByAdmin=0`
3. No real-time (polling every 10 seconds or manual refresh)

### Layout

- **Desktop (>=1024px):** 2-column grid — conversation list (350px fixed) + chat view (flex-1)
- **Mobile (<1024px):** Single view with animated transition — list OR chat, with Back button

## iOS/Android Compatibility — Critical Rules

These rules ensure the webapp chat is 100% interoperable with the mobile apps.

### Identity Format

```
{UserType}_{UserId}
```

Examples: `Individual_118`, `Company_42`

- Twilio users have NO `friendly_name` or `attributes` — names and photos are resolved from SQL Server
- The webapp MUST use the same identity format when generating Twilio tokens

### Conversation Naming Convention

```
unique_name: chat_{TypeA}_{IdA}_{TypeB}_{IdB}
```

- The two identity parts are **always sorted alphabetically** (string comparison)
- `Company_42` comes before `Individual_68` (C < I)
- `Individual_63` comes before `Individual_65` (63 < 65 as strings)
- This is CRITICAL: if we sort differently, duplicate conversations would be created

**Algorithm for generating unique_name:**

```typescript
function getConversationUniqueName(
  typeA: string, idA: number,
  typeB: string, idB: number
): string {
  const keyA = `${typeA}_${idA}`;
  const keyB = `${typeB}_${idB}`;
  const [first, second] = [keyA, keyB].sort();
  return `chat_${first}_${second}`;
}
```

### Friendly Name

```
friendly_name: Chat {Creator} & {Target}
```

Not used for lookup — only for Twilio console display.

### Double Persistence (BD ↔ Twilio)

The .NET backend has a `TwilioConversationWebhook` endpoint that:
- Listens for Twilio events (message added, conversation created)
- Saves to `ChatConversation` and `ChatMessage` tables in SQL Server

**The webapp MUST NOT write to these tables.** The webhook handles persistence. We only:
- READ from Twilio SDK (real-time messages)
- READ from SQL Server (user names, photos)

### Roles

- Service-level: `service user` — can create conversations, join
- Conversation-level: `channel user` — can send messages, media, edit own messages

### Message Format

- `author`: identity string (`Individual_118`)
- `body`: plain text
- `media`: null (images appear unused so far)
- `attributes`: `{}` (empty)

## Twilio Credentials

| Credential | Value | Usage |
|---|---|---|
| Account SID | See `.env.local` | Token generation |
| Auth Token | See `.env.local` | Token generation |
| Service SID | See `.env.local` | Conversations service |
| API Key | See `.env.local` | AccessToken grant |

**Note:** API Key created during implementation. All credentials stored in `.env.local` (not committed).

## UI Components

### ConversationList

Inspired by iOS frame_015:

- **Header:** Title "Messages"
- **Search bar:** Placeholder "Company, Name..." — filters conversations client-side by name
- **Tabs:** "Chats" | "Support" — segmented control style pills
- **ConversationItem:**
  - Avatar (48px circle, photo from SQL, fallback: initials with colored background)
  - Name (bold, truncated) + timestamp (gray, xs, right-aligned)
  - Last message preview (gray, 1 line, truncated)
  - Unread badge (red circle with count) — from Twilio `unreadMessagesCount`
  - Hover: `bg-gray-50`
  - Active: left border coral/red
- **Empty state:** Chat icon + "No conversations yet"
- **Loading:** Skeleton loaders (Isomorphic pattern from `message-list.tsx`)

### ChatHeader

From iOS frames 006-010:

- **Back button:** Left arrow, coral/red text — mobile only (desktop: no back, list stays visible)
- **Avatar:** 40px circle with user photo
- **Name:** Bold text
- **Style:** White background, subtle bottom border

### MessageList (Bubbles)

From iOS frame_010:

- **Sent bubbles (mine):**
  - Background: coral/red (`#E85D5D` — Show United brand red)
  - Text: white
  - Alignment: right
  - Border-radius: rounded with bottom-right corner slightly less rounded
- **Received bubbles (theirs):**
  - Background: light gray (`#F0F0F0`)
  - Text: black/dark gray
  - Alignment: left
  - Border-radius: rounded with bottom-left corner slightly less rounded
- **Timestamp:** Below each bubble, text xs, gray ("1:22 AM")
- **Grouping:** Consecutive messages from same author grouped (smaller gap, no repeated avatar)
- **Date separators:** "Today", "Yesterday", "Apr 14" centered between messages from different days
- **Scroll:** Auto-scroll to bottom on new messages, infinite scroll up for history
- **Image attachments:** Thumbnail inside bubble (click to enlarge) — if media support is used

### MessageInput

From iOS frames 007-008:

- **Input:** Rounded text field, placeholder "Message"
- **Attach button:** Paperclip icon inside input (right side) — opens file picker (images)
- **Send button:** Circular, coral/red background, white arrow icon, outside input to the right
- **States:**
  - Empty input → send button disabled (reduced opacity, lighter red)
  - Text present → send button active (solid red)
- **Keyboard:** Enter to send, Shift+Enter for new line

### Admin Support Chat (Tab "Support")

Same bubble UI but:
- `IsSentByAdmin=true` → coral bubble (right) with small "Admin" label
- `IsSentByAdmin=false` → gray bubble (left) with user name
- Input supports image attachment (`ChatImage` field in AdminChat table)
- No real-time: polling every 10s or manual refresh button

## API Routes

### POST `/api/user/chat-token`

Generates a Twilio AccessToken with Conversations grant.

**Request:**
```json
{ "token": "jwt_token_from_localStorage" }
```

**Logic:**
1. Decode JWT token payload (base64 decode of middle segment)
2. Extract userId: `payload.IndividualUserId` or `payload.CompanyUserId`
3. Extract userType: `payload.UserType` — values are `IndividualUser` or `CompanyUser`
4. Map to Twilio identity: strip "User" suffix → `Individual_{id}` or `Company_{id}`
3. Create Twilio AccessToken with:
   - Account SID
   - API Key SID + Secret (new key we create)
   - Identity
   - ChatGrant with Service SID
4. Set TTL to 1 hour

**Response:**
```json
{
  "twilioToken": "eyJ...",
  "identity": "Individual_118",
  "serviceSid": "<TWILIO_SERVICE_SID>"
}
```

### POST `/api/user/chat-users`

Resolves Twilio identities to user names and photos.

**Request:**
```json
{
  "token": "user_auth_token",
  "identities": ["Individual_114", "Company_42"]
}
```

**Logic:**
1. Parse identities into type + ID pairs
2. Query SQL: `IndividualUser` for Individual types, `CompanyUser` for Company types
3. Get first uploaded photo (ORDER BY ASC) from `IndividualUserImage` / `CompanyUserImage`

**Response:**
```json
{
  "users": {
    "Individual_114": {
      "name": "Stefano Pistolato",
      "photo": "https://api.showunited.com/IndividualUserImage/filename.jpg",
      "type": "Individual"
    },
    "Company_42": {
      "name": "Acme Studios",
      "photo": "https://api.showunited.com/CompanyUserImage/logo.jpg",
      "type": "Company"
    }
  }
}
```

### POST `/api/user/chat-create`

Creates a new Twilio conversation (called from user profile "Message" button).

**Request:**
```json
{
  "token": "user_auth_token",
  "targetUserId": 114,
  "targetUserType": "Individual"
}
```

**Logic:**
1. Extract current user identity from token
2. Build target identity: `{targetUserType}_{targetUserId}`
3. Generate sorted `unique_name`: `chat_{sorted_first}_{sorted_second}`
4. Check if conversation already exists (Twilio API lookup by unique_name)
5. If exists → return existing conversation SID
6. If not → create conversation, add both participants, return new SID
7. Do NOT write to ChatConversation table — the .NET webhook handles that

**Response:**
```json
{
  "conversationSid": "CH75ab4a22b3584533b4551167bd9d1bfe",
  "isNew": true
}
```

### GET `/api/user/admin-chat`

Lists admin support messages for the current user.

**Request (query params):**
```
?token=xxx&page=1
```

**Logic:**
1. Extract userId and userType from token
2. Query `AdminChat` WHERE `IndividualUserId = userId` (or `CompanyUserId`)
3. ORDER BY `DTStamp` DESC, paginate (20 per page)

**Response:**
```json
{
  "messages": [
    {
      "id": 1,
      "isSentByAdmin": true,
      "message": "Hello, how can we help?",
      "image": null,
      "createdAt": "2026-04-15T10:00:00Z",
      "isRead": true
    }
  ],
  "page": 1,
  "hasMore": false
}
```

### POST `/api/user/admin-chat`

Sends a message in the admin support chat.

**Request:** `multipart/form-data`
- `token`: auth token
- `ChatMessage`: text content
- `LogoFile`: image file (optional)

**Logic:**
1. Extract userId and userType from token
2. If image: upload to server or encode
3. INSERT into `AdminChat` with `IsSentByAdmin=0`, `IsRead=0`, `StatusId=1`

**Response:**
```json
{
  "id": 123,
  "message": "Thanks for your help",
  "createdAt": "2026-04-15T10:05:00Z"
}
```

## File Structure

```
src/app/(user)/messages/
├── page.tsx                    # Main Messages page
├── layout.tsx                  # Layout (no extra padding)
└── _components/
    ├── conversation-list.tsx   # Conversation list with search + tabs
    ├── conversation-item.tsx   # Single conversation row
    ├── chat-view.tsx           # Chat view (header + messages + input)
    ├── chat-header.tsx         # Header: avatar, name, back
    ├── message-list.tsx        # Scrollable bubble list
    ├── message-bubble.tsx      # Single bubble (sent/received variants)
    ├── message-input.tsx       # Input with attach + send
    ├── admin-chat-view.tsx     # Support tab chat view
    ├── date-separator.tsx      # "Today", "Yesterday" separator
    └── empty-state.tsx         # Empty conversation state

src/app/api/user/
├── chat-token/route.ts         # Twilio JWT token generation
├── chat-users/route.ts         # Resolve identities to names/photos
├── chat-create/route.ts        # Create new Twilio conversation
└── admin-chat/route.ts         # Admin support chat CRUD

src/lib/
└── twilio-chat.ts              # Twilio SDK wrapper (client-side singleton)
```

## Dependencies

**New npm packages:**

```
@twilio/conversations    # Client-side Twilio Conversations SDK (~150KB)
twilio                   # Server-side Twilio SDK (token generation, API calls)
```

**Existing (reused from Isomorphic/project):**

- `rizzui` — Avatar, Badge, Text, Title, Button, ActionIcon, Empty, Loader
- `jotai` — State management (active conversation, user cache)
- `react-icons/pi` — PiPaperclipLight, PiPaperPlaneRightFill, PiArrowLeftBold, PiChatCircleFill
- `tailwind` — All styling
- `mssql` — SQL Server queries (server-side only)
- `axios` — API calls from client

## State Management

```typescript
// Jotai atoms
activeConversationSidAtom    // string | null — currently open conversation
activeTabAtom                // 'chats' | 'support'
twilioClientAtom             // Client instance (singleton)
userCacheAtom                // Map<identity, { name, photo, type }>
```

- Twilio client is initialized once and stored in atom
- User info is cached in a Map to avoid repeated SQL queries
- Active conversation changes when clicking a ConversationItem

## Error Handling

- **Twilio token expired:** Auto-refresh via `tokenAboutToExpire` event
- **Twilio connection lost:** Show toast "Connection lost, reconnecting..." + auto-reconnect
- **User not found in SQL:** Show identity as fallback name, generic avatar
- **Conversation create fails:** Show error toast, don't navigate
- **Admin chat polling fails:** Silent retry, no error shown to user

## Testing Approach

1. **Manual testing with real Twilio data:** Send message from webapp → verify it appears in iOS app
2. **Verify conversation naming:** Create conversation from webapp → verify `unique_name` matches iOS convention
3. **Cross-platform message delivery:** Send from iOS → verify real-time arrival in webapp
4. **Token refresh:** Wait for token expiry → verify auto-refresh works
5. **Admin chat:** Send message → verify it appears in AdminChat table with correct fields

## Out of Scope

- Push notifications (requires service worker setup)
- Typing indicators (can be added later via Twilio SDK)
- Read receipts UI (data available via Twilio, UI deferred)
- Group conversations (only 1-to-1 per current iOS app)
- Voice/video calls
- Message search within conversations
- Message editing/deletion
