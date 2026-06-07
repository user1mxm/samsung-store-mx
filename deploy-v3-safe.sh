#!/usr/bin/env bash
set -euo pipefail
#────────────────────────────────────────────────────────────────
# Samsung Store MX — Deploy v3 (versión segura)
# Correcciones vs deploy-v3-final.sh:
#   • Backup del .env de producción ANTES de sobrescribir
#   • Una sola ruta de migración (drizzle push OR migrate-v3, no ambas)
#   • Backup del código antes de extraer
#   • Verificación de endpoints al final
# Uso (desde tu Mac):
#   chmod +x deploy-v3-safe.sh && ./deploy-v3-safe.sh
# Requiere: samsung-v3-final.tar.gz en el mismo directorio
#────────────────────────────────────────────────────────────────

VPS="root@69.6.207.180"
PORT=22022
# Si la llave no está en authorized_keys, ssh pedirá contraseña — es normal.
SSH="ssh -p ${PORT} -i ${HOME}/.ssh/id_ed25519 -o StrictHostKeyChecking=no"
SCP="scp -P ${PORT} -i ${HOME}/.ssh/id_ed25519 -o StrictHostKeyChecking=no"
DIR="$(cd "$(dirname "$0")" && pwd)"
T="${DIR}/samsung-v3-final.tar.gz"

[ ! -f "$T" ] && echo "❌ Falta samsung-v3-final.tar.gz en ${DIR}/" && exit 1

echo "📦 Subiendo... ($(du -h "$T" | cut -f1))"
${SCP} "$T" "${VPS}:/tmp/v3.tar.gz"
echo "✓ Subido"

echo "🔧 Desplegando..."
${SSH} "${VPS}" << 'R'
set -euo pipefail
APP="/opt/samsung-store-mx"

echo "── Backup del código actual ──"
tar czf "/tmp/samsung-backup-$(date +%Y%m%d-%H%M%S).tar.gz" \
  --exclude=node_modules --exclude=.git -C /opt samsung-store-mx 2>/dev/null || true

echo "── Backup del .env de producción ──"
if [ -f "${APP}/.env" ]; then
  cp "${APP}/.env" "${APP}/.env.backup-pre-v3-$(date +%Y%m%d-%H%M%S)"
  echo "   ✓ .env respaldado"
fi

echo "── Extrayendo v3 ──"
cd /opt && tar xzf /tmp/v3.tar.gz
cd "${APP}"

echo "── Configurando .env ──"
# Solo sobrescribe si existe .env.production; el backup ya está hecho arriba.
[ -f .env.production ] && cp .env.production .env && echo "   ✓ .env actualizado"

mkdir -p uploads && chmod 755 uploads

echo "── Limpiando NODE_ENV del .env (Vite 7 no lo acepta) ──"
# NODE_ENV de producción va en PM2, no en el .env que lee Vite.
sed -i '/^NODE_ENV=/d' .env 2>/dev/null || true
sed -i '/^NODE_ENV=/d' .env.production 2>/dev/null || true

echo "── npm install ──"
npm install --no-audit --no-fund 2>&1 | tail -3

echo "── Build ──"
npm run build 2>&1 | tail -5

echo "── Migración DB (UNA sola ruta) ──"
# Elige UNA. Por defecto usa el script de migración explícito v3.
# Si prefieres drizzle push, comenta la línea de tsx y descomenta la de drizzle-kit.
npx tsx db/migrate-v3.ts 2>&1 || echo "⚠ Migración falló — revisa manualmente"
# npx drizzle-kit push --force 2>&1 | tail -5

echo "── Seed (idempotente) ──"
npx tsx db/seed.ts 2>&1 | tail -3 || true

echo "── PM2 ──"
pm2 restart samsung-store 2>/dev/null || pm2 start dist/boot.js --name samsung-store
pm2 save
sleep 2

echo "── Verificación ──"
echo "ping:   $(curl -s -o /dev/null -w '%{http_code}' 'http://127.0.0.1:3001/api/trpc/ping?batch=1&input=%7B%7D')"
echo "upload: $(curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1:3001/api/upload) (esperado 401)"
echo "✅ DEPLOY COMPLETADO"
R
echo "✅ Listo — abre https://samsungstore.com.mx"
