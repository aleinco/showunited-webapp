# HANDOFF — Show United Admin Dashboard

## Fase actual: Chat/Messages COMPLETADO Y VERIFICADO

## Último cambio (2026-04-15)
Chat/Messages implementado, desplegado y verificado con mensajes bidireccionales webapp ↔ iOS.

### Lo que se hizo
- **Chat peer-to-peer via Twilio Conversations SDK** — 100% compatible con apps iOS/Android
  - API routes: `chat-token`, `chat-users`, `chat-create`, `chat-persist`
  - Twilio client wrapper con auto-refresh de token
  - UI completa: conversation list, chat view, bubbles, input, header
  - Resolución de nombres/fotos desde SQL Server
  - Real-time messaging via Twilio SDK events
  - **Doble persistencia**: webapp inserta en ChatConversation y ChatMessage como fallback del webhook .NET
- **Admin Support Chat via SQL Server** — tabla AdminChat
  - API route GET/POST con paginación
  - Polling cada 10 segundos
- **Main Messages page** — layout 2 columnas desktop, vista única mobile
- **Dockerfile** — Multi-stage build para Next.js standalone
- **Deploy** — Container `showunited-webapp-container` en VPS 178.104.122.244

### Bugs corregidos
1. Lista mostraba identidad propia en vez del contacto (closure stale en `getContactIdentity`)
2. Mensajes webapp no se guardaban en SQL (webhook .NET no procesaba el primer mensaje de conversaciones nuevas) — fix: webapp inserta en ChatConversation al crear + persiste mensajes como fallback
3. Entrypoint Traefik: Coolify usa `https` no `websecure`

### Deploy
- **Red Docker**: `coolify` (no `traefik-net`)
- **Entrypoint Traefik**: `https` (no `websecure`)
- **Env vars**: pasadas via `docker run -e` (Twilio SIDs + secrets)
- Container viejo Coolify eliminado

### Archivos (18 nuevos)
```
src/app/(user)/messages/page.tsx
src/app/(user)/messages/layout.tsx
src/app/(user)/messages/_components/{conversation-list,conversation-item,chat-view,chat-header,message-list,message-bubble,message-input,admin-chat-view,date-separator,empty-state}.tsx
src/app/api/user/{chat-token,chat-users,chat-create,chat-persist,admin-chat}/route.ts
src/lib/twilio-chat.ts
Dockerfile
```

## Próximo paso
- Typing indicators, read receipts UI, push notifications (fuera de scope actual)
- Stripe payments integration
