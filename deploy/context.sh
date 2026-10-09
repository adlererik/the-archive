#!/usr/bin/env bash
# Erik Adler: resolve this installation rather than a developer's workstation.
archive_project="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
archive_user="${1:-${SUDO_USER:-$(stat -c %U "$archive_project")}}"
if [ "$(id -u)" -ne 0 ]; then printf 'Run this deployment with sudo.\n' >&2; exit 1; fi
if [[ ! "$archive_user" =~ ^[a-z_][a-z0-9_-]*$ ]] || [ "$archive_user" = root ]; then printf 'Provide the non-root account that owns this installation.\n' >&2; exit 1; fi
getent passwd "$archive_user" >/dev/null
if [[ "$archive_project" =~ [[:space:]\"\\%] ]]; then printf 'Use a project path without spaces, quotes, backslashes, or percent signs for systemd deployment.\n' >&2; exit 1; fi
archive_service="the-archive@$archive_user"
archive_node="$archive_project/.runtime/node/bin/node"
if [ ! -x "$archive_node" ]; then archive_node="$(command -v node || true)"; fi
if [ ! -x "$archive_node" ] || ! "$archive_node" -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 24 ? 0 : 1)'; then printf 'Install Node.js 24 or newer system-wide, or at .runtime/node/bin/node.\n' >&2; exit 1; fi
