#!/usr/bin/env bash
set -euo pipefail
SSH="ssh -p 22022 -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=no"
SCP="scp -P 22022 -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=no"
VPS="root@69.6.207.180"
DIR="$(cd "$(dirname "$0")" && pwd)"
T="${DIR}/samsung-v3-final.tar.gz"
[ ! -f "$T" ] && echo "❌ Falta samsung-v3-final.tar.gz en ${DIR}/" && exit 1
echo "📦 Subiendo..." && ${SCP} "$T" "${VPS}:/tmp/v3.tar.gz" && echo "✓"
echo "🔧 Desplegando..."
${SSH} "${VPS}" << 'R'
cd /opt && tar xzf /tmp/v3.tar.gz
cd samsung-store-mx
cp .env.production .env
mkdir -p uploads && chmod 755 uploads
npm install --no-audit --no-fund 2>&1 | tail -3
npm run build 2>&1 | tail -5
npx drizzle-kit push --force 2>&1 | tail -5
npx tsx db/migrate-v3.ts 2>&1
npx tsx db/seed.ts 2>&1 | tail -3
pm2 delete samsung-store 2>/dev/null; pm2 start dist/boot.js --name samsung-store && pm2 save
sleep 2
echo "ping: $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3001/api/trpc/ping?batch=1\&input=%7B%7D)"
echo "upload: $(curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1:3001/api/upload)"
echo "✅ DEPLOY COMPLETADO"
R
echo "✅ Abre https://samsungstore.com.mx"
