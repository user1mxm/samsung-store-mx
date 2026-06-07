#!/usr/bin/env bash
set -euo pipefail
VPS="root@69.6.207.180"
PORT=22022
SSH="ssh -p ${PORT} -o StrictHostKeyChecking=no"
SCP="scp -P ${PORT} -o StrictHostKeyChecking=no"
DIR="$(cd "$(dirname "$0")" && pwd)"
TARBALL="${DIR}/samsung-v3-deploy.tar.gz"

echo "╔══════════════════════════════════════════════════════╗"
echo "║  Samsung Store MX — Deploy v3 al VPS                ║"
echo "╚══════════════════════════════════════════════════════╝"

if [ ! -f "${TARBALL}" ]; then
  echo "❌ Falta samsung-v3-deploy.tar.gz en ${DIR}/"; exit 1
fi

echo "📦 Subiendo al VPS... (te pedirá la contraseña)"
${SCP} "${TARBALL}" "${VPS}:/tmp/samsung-v3-deploy.tar.gz"
echo "✓ Subido"

echo "🔧 Instalando... (contraseña de nuevo)"
${SSH} "${VPS}" << 'REMOTE'
set -euo pipefail
APP="/opt/samsung-store-mx"
echo "── Backup ──"
tar czf "/tmp/samsung-backup-$(date +%Y%m%d-%H%M%S).tar.gz" --exclude=node_modules --exclude=.git -C /opt samsung-store-mx 2>/dev/null || true
echo "── Extrayendo v3 ──"
tar xzf /tmp/samsung-v3-deploy.tar.gz -C /opt/
cd "${APP}"
cp .env .env.backup-pre-v3 2>/dev/null || true
[ -f .env.production ] && cp .env.production .env
mkdir -p uploads && chmod 755 uploads
echo "── npm install ──"
npm install --no-audit --no-fund 2>&1 | tail -3
echo "── Build ──"
npm run build 2>&1 | tail -5
echo "── Migración DB ──"
export $(grep -v '^#' .env | grep -v '^$' | xargs 2>/dev/null) 2>/dev/null || true
npx tsx db/migrate-v3.ts 2>&1 || echo "⚠ Migración falló — corre manualmente"
echo "── PM2 ──"
pm2 restart samsung-store 2>/dev/null || pm2 start dist/boot.js --name samsung-store
pm2 save
sleep 2
echo "── Verificación ──"
curl -s -o /dev/null -w "ping: %{http_code}\n" "http://127.0.0.1:3001/api/trpc/ping?batch=1&input=%7B%7D"
curl -s -o /dev/null -w "upload: %{http_code} (esperado 401)\n" -X POST "http://127.0.0.1:3001/api/upload"
echo "✅ Deploy v3 completado — abre https://samsungstore.com.mx"
REMOTE
