#!/usr/bin/env bash
# Erik Adler: switch the installed service to a stable account-owned tunnel.
set -euo pipefail
if [ "$(id -u)" -ne 0 ]; then printf 'Run using sudo.\n' >&2; exit 1; fi
if [ ! -f /etc/the-archive-tunnel/tunnel.env ]; then printf 'Install the tunnel service first.\n' >&2; exit 1; fi
read -r -s -p 'Paste only the Cloudflare tunnel token (hidden): ' archive_token
printf '\n'
if [ -z "$archive_token" ] || [[ "$archive_token" =~ [[:space:]] ]]; then printf 'Invalid token format.\n' >&2; exit 1; fi
umask 077
printf '%s' "$archive_token" > /etc/the-archive-tunnel/token
unset archive_token
chown erik:erik /etc/the-archive-tunnel/token
chmod 600 /etc/the-archive-tunnel/token
printf 'TUNNEL_MODE=named\n' > /etc/the-archive-tunnel/tunnel.env
chmod 644 /etc/the-archive-tunnel/tunnel.env
systemctl restart the-archive-tunnel
systemctl is-active the-archive-tunnel
printf 'Named tunnel connector started. Add its published application route in Cloudflare.\n'
