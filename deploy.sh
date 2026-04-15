#!/bin/bash
set -e

# Show United — Deploy en un comando
# Uso: ./deploy.sh [mensaje commit opcional]

VPS="root@178.104.122.244"
CONTAINER="showunited-webapp"
IMAGE="showunited-webapp:latest"
NETWORK="coolify"

# Load secrets from .env.deploy (git-ignored)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/.env.deploy" ]; then
  source "$SCRIPT_DIR/.env.deploy"
else
  echo "❌ Missing .env.deploy — create it from .env.deploy.example"
  exit 1
fi

ENV_VARS="-e ADMIN_API_URL=https://admin.showunited.com \
-e NEXT_PUBLIC_APP_NAME='Show United Admin' \
-e TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID \
-e TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN \
-e TWILIO_API_KEY_SID=$TWILIO_API_KEY_SID \
-e TWILIO_API_KEY_SECRET=$TWILIO_API_KEY_SECRET \
-e TWILIO_CONVERSATIONS_SERVICE_SID=$TWILIO_CONVERSATIONS_SERVICE_SID"

# Traefik labels
LABELS="-l traefik.enable=true \
-l traefik.http.routers.showunited-http.rule=Host(\`app.showunited.com\`) \
-l traefik.http.routers.showunited-http.entryPoints=http \
-l traefik.http.routers.showunited-http.middlewares=redirect-to-https@docker \
-l traefik.http.routers.showunited-https.rule=Host(\`app.showunited.com\`) \
-l traefik.http.routers.showunited-https.entryPoints=https \
-l traefik.http.routers.showunited-https.tls=true \
-l traefik.http.routers.showunited-https.tls.certresolver=letsencrypt \
-l traefik.http.services.showunited.loadbalancer.server.port=3000"

echo "=== Show United Deploy ==="

# 1. Git push
echo "📤 Pushing to GitHub..."
git add -A
git commit -m "${1:-deploy: update}" --allow-empty 2>/dev/null || true
git push origin main 2>/dev/null || git push origin master 2>/dev/null

# 2. Build + deploy en VPS via SSH
echo "🚀 Building & deploying on VPS..."
ssh $VPS bash -s "$GITHUB_TOKEN" <<'REMOTE'
set -e
GH_TOKEN="$1"
echo "-- Cloning repo..."
rm -rf /tmp/su-build
git clone --depth 1 https://aleinco:${GH_TOKEN}@github.com/aleinco/showunited-webapp.git /tmp/su-build

echo "-- Building Docker image..."
cd /tmp/su-build
docker build -t showunited-webapp:latest .

echo "-- Stopping old container..."
docker stop showunited-webapp 2>/dev/null || true
docker rm showunited-webapp 2>/dev/null || true

echo "-- Starting new container..."
REMOTE

# El docker run necesita las vars expandidas localmente
ssh $VPS "docker run -d \
  --name $CONTAINER \
  --network $NETWORK \
  --restart unless-stopped \
  $ENV_VARS \
  $LABELS \
  $IMAGE"

# 3. Verificar
echo "⏳ Waiting 5s for startup..."
sleep 5
STATUS=$(ssh $VPS "curl -s -o /dev/null -w '%{http_code}' https://app.showunited.com/signin")

if [ "$STATUS" = "200" ]; then
  echo "✅ Deploy OK — https://app.showunited.com (HTTP $STATUS)"
else
  echo "⚠️  HTTP $STATUS — revisar logs: ssh $VPS docker logs $CONTAINER"
fi

# 4. Limpiar
ssh $VPS "rm -rf /tmp/su-build"
echo "🧹 Cleanup done"
