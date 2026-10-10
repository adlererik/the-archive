# Operations and migration

By Erik Adler.

Start with the [beginner walkthrough](BEGINNER-GUIDE.md). The [public setup reference](PUBLIC-SETUP.md) covers prerequisites, restoration, release upgrades, boot service installation, and previous-build fallback. [Cloudflare operations](CLOUDFLARE.md) covers your separate HTTPS connector.

## Foreground installation

Run these in the project folder. Keep the start terminal open:

```bash
./archive start
./archive status
./archive stop
./archive restart
```

Rebuild after source or public configuration changes with `./archive build`. The default port is 3000, bound to all network interfaces. Port conflicts produce an error.

## Debian boot service

After a successful initial setup/build, install the service from the checkout:

```bash
sudo bash deploy/setup-debian-root.sh "$USER"
systemctl is-enabled "the-archive@$USER"
systemctl is-active "the-archive@$USER"
```

The installer resolves the actual checkout and account, supports a private `.runtime/node/bin/node` or system Node 24+, installs FFmpeg/Git prerequisites, and enables boot startup. It does not grant sudo privileges. Use a checkout path without spaces, quotes, backslashes, or percent signs.

```bash
sudo systemctl stop "the-archive@$USER"
sudo systemctl start "the-archive@$USER"
sudo systemctl restart "the-archive@$USER"
sudo systemctl status "the-archive@$USER" --no-pager
sudo journalctl -u "the-archive@$USER" -n 100 --no-pager
```

Use the boot service or foreground launcher to own the server. Do not start two copies on port 3000. Enabled services start after a reboot; an application restart does not require a machine reboot.

## Backups and migration

Stop the application before copying SQLite, or use SQLite's online backup facility. Keep a matching private backup of `prisma/dev.db`, the complete `public/uploads/` directory, `.env`, `.env.local`, `.runtime/admin-auth.json`, `.runtime/visitor-exclusions.json`, and `.runtime/shared-links/` when present. Restore those paths on a new server, preserve owner-only environment permissions, install locked dependencies, build, and check login/media before switching traffic. Original and derived upload files belong in the backup; caches under `work/` can be regenerated. Browser favorites and themes are tied to each browser/site address and are separate from SQLite backups.

### Copy a private backup on Debian/Ubuntu

Stop the foreground launcher with `./archive stop`, or the boot service with `sudo systemctl stop "the-archive@$USER"`. Then run this from the project folder:

```bash
archive_backup="$HOME/Archive-backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$archive_backup"
chmod 700 "$HOME/Archive-backups" "$archive_backup"
cp -a --parents .env .env.local prisma/dev.db public/uploads "$archive_backup/"
for archive_private in .runtime/admin-auth.json .runtime/visitor-exclusions.json .runtime/shared-links; do
  if [ -e "$archive_private" ]; then
    cp -a --parents "$archive_private" "$archive_backup/"
  fi
done
chmod -R go-rwx "$archive_backup"
```

Check that the copy finished without errors and contains the expected files, then restart with `./archive start` or `sudo systemctl start "the-archive@$USER"`. Store a second private copy on a separate disk. These backup files contain your photos, passwords, and visitor information; never upload them to a public repository.

For an optional named Cloudflare Tunnel, separately preserve its private `/etc/the-archive-tunnel/` configuration through your administrator's backup process. Changing the public hostname can break already sent URLs. See [Sharing](SHARING.md) before a migration. Read [Administration](ADMIN.md) for password or identity-mode recovery.

## Release upgrades

Back up first and record the current revision. Substitute the desired release tag:

```bash
git fetch origin --tags
git checkout v1.3.0
./archive install
```

v1.3.0 has no schema change from v1.2.0. If upgrading from an older release, apply the optional soundtrack fields introduced in v1.2.0 with `pnpm db:push` after reviewing the schema. Never accept a destructive reset as an installation fix. Existing credentials and login mode are preserved; only fresh installations default to password login.

For the boot service:

```bash
sudo bash deploy/rebuild-archive-root.sh "$USER"
```

This stops the service, preserves its previous production build, compiles as the owning user, restarts, and checks readiness. Build/start failure restores the previous build. This is a build fallback; database and source rollback require your private backup and recorded revision. Dependency installation and any approved schema changes must already be complete.

For the foreground launcher: stop, build, and start with `./archive stop`, `./archive build`, and `./archive start`. `./archive update` changes dependencies and is a developer operation, not the normal release upgrade command.

## Public HTTPS

Use an HTTPS reverse proxy or [Cloudflare Tunnel](CLOUDFLARE.md). Configure `SESSION_COOKIE_SECURE=true` and trust proxy headers only from your trusted loopback proxy. Preserve media byte-range and CORS headers. A TV needs a reachable public media URL; its localhost is not your server. The tunnel boot service is managed separately with `sudo systemctl restart the-archive-tunnel`.
