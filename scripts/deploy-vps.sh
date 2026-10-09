#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

LIVE=/opt/samsung-store-mx
STAGE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
EXPECTED=${1:?Pass the reviewed commit SHA}
STOPPED=0
CODE_CHANGED=0
BACKUP=

fail() { printf '%s\n' "$*" >&2; exit 1; }
recover() {
  local status=$?
  trap - ERR INT TERM
  set +e
  if test "$STOPPED" -eq 1; then
    printf '\nDeployment failed; restoring the previous application.\n' >&2
    if test "$CODE_CHANGED" -eq 1; then tar -xzf "$BACKUP/site.tar.gz" -C "$LIVE"; fi
    if test -d "$BACKUP/dist"; then
      if test -e "$LIVE/dist"; then mv "$LIVE/dist" "$BACKUP/failed-dist"; fi
      mv "$BACKUP/dist" "$LIVE/dist"
    fi
    if test -d "$BACKUP/node_modules"; then
      if test -e "$LIVE/node_modules"; then mv "$LIVE/node_modules" "$BACKUP/failed-node_modules"; fi
      mv "$BACKUP/node_modules" "$LIVE/node_modules"
    fi
    PAYMENTS_ENABLED=0 pm2 restart samsung-store --update-env
    curl --fail --silent --show-error --retry 8 --retry-delay 1 --retry-connrefused --max-time 10 http://127.0.0.1:3001/api/trpc/ping
    printf '\nAdditive schema changes remain. No database restore was attempted.\n' >&2
  fi
  printf '\nStopped. Private backup/logs: %s\n' "${BACKUP:-not created}" >&2
  exit "${status:-1}"
}
trap recover ERR
trap 'false' INT TERM

test "$(id -u)" -eq 0 || fail 'Run as root on the VPS'
test "$STAGE" != "$LIVE" || fail 'Run from a separate staging checkout'
test -d "$LIVE" && test ! -L "$LIVE" || fail 'Unexpected production directory'
test "$(git -C "$STAGE" rev-parse HEAD)" = "$EXPECTED" || fail 'Staging commit does not match the reviewed revision'
test -z "$(git -C "$STAGE" status --porcelain)" || fail 'Staging checkout has local changes'
for tool in node npm pm2 git tar curl flock; do command -v "$tool" >/dev/null || fail "Missing tool: $tool"; done
if ! command -v rsync >/dev/null || ! command -v mysqldump >/dev/null; then
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y rsync default-mysql-client
fi
exec 9>/var/lock/samsung-store-deploy.lock
flock -n 9 || fail 'Another deployment is running'
node -e 'const [major,minor]=process.versions.node.split(".").map(Number); if(major<20 || (major===20 && minor<19)) process.exit(1)'

printf '\nCheck the uploaded production source baseline\n'
node --input-type=module - "$LIVE" "$STAGE/docs/vps-source-manifest.json" <<'NODE'
import { readFileSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
const [live, manifest] = process.argv.slice(2);
let failed=false;
for(const [path, expected] of Object.entries(JSON.parse(readFileSync(manifest,'utf8')))) {
  try {
    const full=`${live}/${path}`;
    if(!lstatSync(full).isFile() || createHash('sha256').update(readFileSync(full)).digest('hex')!==expected) throw new Error();
  } catch { console.error(`Source changed or missing: ${path}`); failed=true; }
}
if(failed) process.exit(1);
console.log('Production baseline matches the uploaded source');
NODE

mkdir -p /opt/samsung-backups
BACKUP=$(mktemp -d /opt/samsung-backups/reconciled-XXXXXXXX)
pm2 jlist > "$BACKUP/pm2-runtime.json"
tar --exclude='./node_modules' --exclude='./dist' --exclude='./.git' --exclude='./uploads' \
  -czf "$BACKUP/site.tar.gz" -C "$LIVE" .

printf '\nPreserve existing public images and build the isolated release\n'
if test -d "$LIVE/public"; then rsync -a "$LIVE/public/" "$STAGE/public/"; fi
if test -d "$LIVE/dist/public"; then
  rsync -a --exclude=assets --exclude=index.html "$LIVE/dist/public/" "$STAGE/public/"
fi
cd "$STAGE"
npm ci --include=dev --no-audit --no-fund
node --test tests/cart-safety.test.mjs tests/payment-contracts.test.mjs tests/reconciliation.test.mjs tests/route-contracts.test.mjs
npm run build
node tests/production-smoke.mjs
node scripts/vps-db.mjs preflight "$LIVE" "$BACKUP/pm2-runtime.json"
node scripts/vps-health.mjs shadow "$LIVE" "$BACKUP/pm2-runtime.json" "$BACKUP"

printf '\nStop application writes, back up MySQL, verify additive migrations\n'
STOPPED=1
pm2 stop samsung-store
node scripts/vps-db.mjs backup-migrate "$LIVE" "$BACKUP/pm2-runtime.json" "$BACKUP"

printf '\nInstall the prepared application\n'
CODE_CHANGED=1
rsync -a --exclude=seed.ts --exclude=migrate-v3.ts \
  "$STAGE/src" "$STAGE/api" "$STAGE/db" "$STAGE/contracts" \
  "$STAGE/tests" "$STAGE/docs" "$STAGE/scripts" "$LIVE/"
cp "$STAGE/package.json" "$STAGE/package-lock.json" "$LIVE/"
mv "$LIVE/dist" "$BACKUP/dist"
mv "$STAGE/dist" "$LIVE/dist"
if test -d "$LIVE/node_modules"; then mv "$LIVE/node_modules" "$BACKUP/node_modules"; fi
mv "$STAGE/node_modules" "$LIVE/node_modules"
PAYMENTS_ENABLED=0 pm2 restart samsung-store --update-env
curl --fail --silent --show-error --retry 8 --retry-delay 1 --retry-connrefused --max-time 10 http://127.0.0.1:3001/api/trpc/ping
node "$LIVE/scripts/vps-health.mjs" live
pm2 save
printf '%s\n' "$EXPECTED" > "$LIVE/.samsung-release"
STOPPED=0
trap - ERR INT TERM
printf '\nDEPLOY COMPLETE\nCommit: %s\nPrivate rollback backup: %s\nPayments remain disabled.\n' "$EXPECTED" "$BACKUP"
