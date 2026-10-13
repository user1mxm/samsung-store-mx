#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
test "$(id -u)" -eq 0
test -f /opt/samsung-store-mx/scripts/operations-monitor.mjs
NODE_BIN=$(command -v node)
PM2_BIN=$(command -v pm2)
MONITOR_PATH="$(dirname "$NODE_BIN"):$(dirname "$PM2_BIN"):/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
mkdir -p /opt/samsung-backups/operations
chmod 700 /opt/samsung-backups/operations
# Verify one restorable backup before enabling the scheduler.
cd /opt/samsung-store-mx
"$NODE_BIN" scripts/operations-monitor.mjs backup
printf 'PATH=%s\n*/5 * * * * root cd /opt/samsung-store-mx && %s scripts/operations-monitor.mjs health >> /opt/samsung-backups/operations/monitor.log 2>&1\n30 3 * * * root cd /opt/samsung-store-mx && %s scripts/operations-monitor.mjs backup >> /opt/samsung-backups/operations/backup.log 2>&1\n' "$MONITOR_PATH" "$NODE_BIN" "$NODE_BIN" > /etc/cron.d/samsung-store-monitor
chmod 600 /etc/cron.d/samsung-store-monitor
"$NODE_BIN" scripts/operations-monitor.mjs health
printf 'Monitoreo cada 5 minutos y respaldo diario verificado configurados.\n'
