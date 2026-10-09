#!/usr/bin/env bash
# Erik Adler: install Debian prerequisites, administrator access, and the boot service.
set -euo pipefail
archive_user="${1:-erik}"
if [ "$(id -u)" -ne 0 ]; then printf 'Run this setup as root.\n' >&2; exit 1; fi
if [[ ! "$archive_user" =~ ^[a-z_][a-z0-9_-]*$ ]]; then printf 'Invalid account name.\n' >&2; exit 1; fi
archive_project="/home/$archive_user/the-archive"
getent passwd "$archive_user" >/dev/null
if [ ! -f "$archive_project/.next/BUILD_ID" ] || [ ! -f "$archive_project/.env.local" ]; then
  printf 'Complete the project transfer and production build first.\n' >&2
  exit 1
fi
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y sudo ffmpeg git ca-certificates
usermod -aG sudo "$archive_user"
visudo -c
sudo -l -U "$archive_user"
install -m 644 "$archive_project/deploy/the-archive@.service" /etc/systemd/system/the-archive@.service
systemctl daemon-reload
runuser -u "$archive_user" -- "$archive_project/archive" stop
systemctl enable --now "the-archive@$archive_user"
systemctl is-enabled "the-archive@$archive_user"
systemctl is-active "the-archive@$archive_user"
printf 'Sudo access and boot startup are configured. Open a new SSH session for the updated group membership.\n'
