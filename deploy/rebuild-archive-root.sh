#!/usr/bin/env bash
# Erik Adler: rebuild the systemd deployment with a recoverable production build.
set -euo pipefail
if [ "$(id -u)" -ne 0 ]; then printf 'Run this deployment with sudo.\n' >&2; exit 1; fi
archive_project=/home/erik/the-archive
archive_backup="$archive_project/.runtime/build-backups/$(date -u +%Y%m%dT%H%M%SZ)-$$"
mkdir -p "$archive_backup"
archive_committed=false
archive_recover() {
  if [ "$archive_committed" = false ]; then
    if [ -d "$archive_backup/.next" ]; then
      systemctl stop the-archive@erik
      if [ -d "$archive_project/.next" ]; then mv "$archive_project/.next" "$archive_backup/failed-build"; fi
      mv "$archive_backup/.next" "$archive_project/.next"
    fi
    systemctl start the-archive@erik
    printf 'Deployment did not finish. The previous production build was preserved.\n' >&2
  fi
}
trap archive_recover EXIT
systemctl stop the-archive@erik
if [ -d "$archive_project/.next" ]; then mv "$archive_project/.next" "$archive_backup/.next"; fi
runuser -u erik -- env NODE_OPTIONS=--max-old-space-size=2304 "$archive_project/archive" build
systemctl start the-archive@erik
for archive_attempt in $(seq 1 30); do
  if python3 - <<'PY'
import urllib.request
try:
    with urllib.request.urlopen('http://127.0.0.1:3000/api/cast/config', timeout=2) as response:
        raise SystemExit(0 if response.status == 200 else 1)
except Exception:
    raise SystemExit(1)
PY
  then
    archive_committed=true
    systemctl is-active the-archive@erik
    printf 'Deployment complete. Reload the HTTPS page on your phone before casting.\n'
    exit 0
  fi
  sleep 1
done
printf 'The new production server did not become ready.\n' >&2
systemctl stop the-archive@erik
exit 1
