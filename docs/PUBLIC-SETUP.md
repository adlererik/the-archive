# Install, operate, and migrate your own Archive

By Erik Adler.

## Local installation

Use Linux with Node.js 24+, pnpm 12.10.1, FFmpeg/FFprobe, Git, and Bash. The lockfile fixes dependency versions. Install pnpm using `npm install -g pnpm@12.10.1`; install FFmpeg on Debian using `sudo apt-get install ffmpeg`. Node must be on PATH, or installed privately at `.runtime/node/bin/node`.

Clone the repository or extract a release, enter its folder, and run `./archive setup`. This generates private environment files, installs dependencies, applies the Prisma schema to an empty database, and builds. The initial username is `admin`; its random password is stored in `.env.local`. Read it locally without sharing that file. Run `./archive start`, then open `http://localhost:3000/admin/login`. Upload your own media and change account/header settings in Admin.

The release contains no gallery media or populated database. `.env.example` is a configuration reference with placeholders, not usable login credentials. `.env` holds Prisma's database URL; `.env.local` holds Next.js settings. Keep their `DATABASE_URL` values aligned. `file:./dev.db` resolves to `prisma/dev.db`. Changing `NEXT_PUBLIC_BIRTH_DATE` requires a rebuild.

Manual equivalent:

```bash
node scripts/setup.mjs
pnpm install --frozen-lockfile
pnpm db:push
pnpm build
pnpm start
```

Setup is intended for initialization; it does not reset existing accounts, media, or environment files. Review schema changes before applying them to existing data. Never accept a destructive Prisma reset without a verified backup.

## Start, stop, restart, and reboot

`./archive start` runs in the foreground; keep that terminal open. In another terminal in the same folder, use `./archive status`, `./archive stop`, or `./archive restart`. A restart starts the existing production build; rebuild after source changes. Ctrl+C also stops a foreground launcher. The default port is 3000 on all interfaces, so other Wi-Fi devices can use the server's LAN address. The launcher refuses to use a busy port.

Use systemd on Debian for boot startup. Run setup and the production build as a **non-root** account that owns the checkout. Install Node 24 system-wide or privately in `.runtime/node/bin/node`; the root deployment script needs to locate it. Use a checkout path without spaces, quotes, backslashes, or percent signs. In that folder:

```bash
sudo bash deploy/setup-debian-root.sh "$USER"
sudo systemctl status "the-archive@$USER" --no-pager
systemctl is-enabled "the-archive@$USER"
```

The installer infers its actual checkout path, installs prerequisites, renders the service, stops a foreground launcher, and enables the boot service. It does not grant the application user sudo access. The template installer supports one checkout per machine. Replace `youruser` below with that account:

```bash
sudo systemctl stop the-archive@youruser
sudo systemctl start the-archive@youruser
sudo systemctl restart the-archive@youruser
sudo journalctl -u the-archive@youruser -n 100 --no-pager
sudo systemctl disable --now the-archive@youruser
sudo systemctl enable --now the-archive@youruser
```

After `sudo reboot`, enabled services start automatically. Do not also start a foreground copy on the same port. Inspect systemd status/logs if the site is unavailable.

## Back up and migrate

Stop the application before copying the SQLite database. Store `prisma/dev.db`, the complete `public/uploads/` directory, `.env.local`, and `.env` in a separate **private** backup. SQLite contains posts, account hashes, hearts, site settings, and visitor records. Generated media is also under uploads. Favorites belong to each viewer's browser and are not a server backup.

On the destination machine, install prerequisites, clone the desired release tag, and install dependencies with `./archive install`. Restore private files to the same relative paths and keep restrictive environment-file permissions (`chmod 600 .env .env.local`). As the owning user, run `pnpm db:push` after reviewing its proposed schema changes, then `./archive build`. Start locally or install the boot service. Check the gallery, login, and media before switching traffic. Do not run setup to generate a second account when restoring an existing database.

## Update the application

Make a private backup first. Prefer a published release tag:

```bash
git fetch origin --tags
git checkout v1.0.0  # Substitute the release you intend to install.
./archive install
# Review schema changes, then apply only if appropriate:
pnpm db:push
```

For a foreground installation: `./archive stop`, `./archive build`, `./archive start`.

For systemd, run `sudo bash deploy/rebuild-archive-root.sh youruser`. This stops the service, preserves the previous production build, builds as the owning user, restarts, and checks readiness. Failed builds restore the previous build. This is a build rollback, not a database/source rollback; keep a database backup and record the previous Git revision before updating. Dependency installation and schema changes must already be complete.

`./archive update` updates dependency versions and the lockfile; it is a developer operation, not the normal release-upgrade command. Public releases are source-only and contain no automatic destructive migrations.

## HTTPS and Google Cast

For public hosting, install Cloudflare's official cloudflared binary for your architecture at `/usr/local/bin/cloudflared`, verifying its published release digest. Follow the [official downloads](https://developers.cloudflare.com/tunnel/downloads/) and [Cloudflare instructions](CLOUDFLARE.md). The installer also supports the specifically pinned original amd64 binary staged at `.runtime/cloudflared/cloudflared`; a different staged version requires updating its pinned digest deliberately.

With the application boot service installed:

```bash
sudo bash deploy/setup-cloudflare-root.sh youruser
```

This installs the tunnel boot service, requests a temporary HTTPS URL, and enables secure cookies and loopback proxy trust. Use HTTPS for admin login afterwards. The service's process survives reboots, but a Quick Tunnel's hostname changes after restart. To use a domain, enroll a named tunnel in Cloudflare and run `sudo bash deploy/use-named-cloudflare-tunnel.sh`, pasting its token at the hidden prompt. The token is stored outside the checkout. See [Cloudflare](CLOUDFLARE.md) for dashboard routes and service operations.

Cast the selected media from the HTTPS gallery. The receiver needs access to that media without an admin cookie. Do not put Cloudflare Access in front of media endpoints unless you have designed compatible receiver authentication. The gallery is public; admin routes require a signed session. Make sure the media you host is intended to be public.
