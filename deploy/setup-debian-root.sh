#!/usr/bin/env bash
# Erik Adler: install Debian prerequisites and the boot service.
set -euo pipefail
source "$(dirname "$0")/context.sh" "${1:-}"
if [ ! -f "$archive_project/.next/BUILD_ID" ] || [ ! -f "$archive_project/.env.local" ]; then
  printf 'Complete the project transfer and production build first.\n' >&2
  exit 1
fi
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y ffmpeg git ca-certificates python3
python3 - "$archive_project" "$archive_node" <<'PY'
from pathlib import Path
import sys
project, node = sys.argv[1:]
unit = (Path(project) / 'deploy/the-archive@.service').read_text()
unit = unit.replace('/home/%i/the-archive/.runtime/node/bin/node', node)
unit = unit.replace('/home/%i/the-archive', project)
Path('/etc/systemd/system/the-archive@.service').write_text(unit)
PY
systemctl daemon-reload
runuser -u "$archive_user" -- env PATH="$(dirname "$archive_node"):$PATH" "$archive_project/archive" stop
systemctl enable --now "the-archive@$archive_user"
systemctl is-enabled "the-archive@$archive_user"
systemctl is-active "the-archive@$archive_user"
printf 'Boot startup is configured.\n'
