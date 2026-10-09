# Operations and migration

By Erik Adler.

## Start, stop, restart

Run these commands from the project directory:

```bash
./archive start
./archive status
./archive stop
./archive restart
```

`start` supervises the production server on port 3000. `restart` stops the managed server and starts it again. Run `./archive build` after source changes. For development, `pnpm dev` uses the custom server and binds to all network interfaces.

## Update

Back up first. Pull the reviewed source changes, install with the committed lockfile, regenerate the Prisma client and apply additive database changes, then build and restart:

```bash
git pull --ff-only
./archive install
pnpm db:push
./archive build
./archive restart
```

Review schema changes before applying them to your data. Never accept a destructive database reset to fix an installation issue. Package updates should be reviewed and verified separately; `./archive update` provides the launcher's update workflow.

## Back up and migrate

Stop the server before copying SQLite, or use SQLite's online backup facility. Keep a matching copy of `prisma/dev.db`, all of `public/uploads/`, and `.env.local`. These files are intentionally not in Git. Keep backups private. Local generated caches in `work/` can be recreated.

On the destination server, clone the source, install Node 24+, pnpm, and FFmpeg/FFprobe, restore the database and uploads, provide `.env.local`, run `./archive install`, build, and start. Preserve the existing account database to retain the login settings. Set the correct birth date. Do not run an importer again simply to migrate existing data.

Place the application behind an HTTPS reverse proxy for server use and Google Cast. Enable `SESSION_COOKIE_SECURE=true`; set `TRUST_PROXY=true` only when the trusted proxy connects from localhost. Preserve streaming Range headers and CORS headers. Use a TV-reachable site origin for casting; a TV cannot fetch media from your computer's `localhost` address.

## Start at boot on Linux

Create a systemd service with the actual user, project path, and Node executable on your server. Example:

```ini
[Unit]
Description=The Archive
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=archive
WorkingDirectory=/srv/the-archive
Environment=NODE_ENV=production
Environment=ARCHIVE_HOST=127.0.0.1
ExecStart=/usr/bin/node scripts/server.mjs
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Adjust paths and ownership, then install it as `/etc/systemd/system/the-archive.service`:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now the-archive
sudo systemctl restart the-archive
sudo systemctl stop the-archive
sudo systemctl status the-archive
journalctl -u the-archive -f
```

Use either systemd or the local launcher to own a running server; avoid starting two supervisors for the same port. Rebooting the machine restarts an enabled service. A normal application restart does not require rebooting the machine.

### Headless Debian installation in a user's home

The repository includes `deploy/the-archive@.service` for `/home/<user>/the-archive`, using a private Node 24+ runtime at `.runtime/node/bin/node`. The runtime is not committed to Git. Install FFmpeg/FFprobe on Debian and install the dependencies with the lockfile, generate Prisma, and complete a production build before enabling the service. Keep `.env` and `.env.local` readable only by the application owner. Restore the existing SQLite database and uploads; do not re-import the archive or reset its database.

For the user `erik`, install and enable the service:

```bash
sudo install -m 644 deploy/the-archive@.service /etc/systemd/system/the-archive@.service
sudo systemctl daemon-reload
sudo systemctl enable --now the-archive@erik
sudo systemctl status the-archive@erik
```

The service binds to all network interfaces on port 3000, runs as the specified user, restarts after failures, and starts at boot without an SSH login. It reads the project's environment files and uses the server directly, rather than stacking the local launcher and systemd supervisors.

If a minimal Debian installation has no `sudo`, complete the project transfer and build, then sign in as root (or use `su` with the root password) and run:

```bash
bash /home/erik/the-archive/deploy/setup-debian-root.sh erik
```

This installs Debian's sudo, FFmpeg/FFprobe, Git, and CA packages; adds `erik` to the standard sudo group; validates sudo configuration; and enables and starts the service. Sudo continues to require the account password. A new SSH session picks up the added group membership.

```bash
sudo systemctl stop the-archive@erik
sudo systemctl start the-archive@erik
sudo systemctl restart the-archive@erik
sudo journalctl -u the-archive@erik -n 100 --no-pager
```

For updates under systemd, stop the service, back up the database and uploads, pull source, install dependencies, build, and restart with `systemctl`. Avoid `./archive update` or `./archive restart` while systemd owns the server. Check both `systemctl is-enabled the-archive@erik` and `systemctl is-active the-archive@erik` after installation. A reboot check should be done when other work on the server can be interrupted.

Favorites and theme choices live in each browser's storage, tied to the site's address. Moving to a different IP address preserves server media, captions, login settings, hearts, and visitor history, but browser preferences at the old address are not part of the SQLite migration. A source checkout from a private GitHub repository also needs its own repository authentication for future pulls; transfer files or a source-only Git bundle without copying workstation credentials.
