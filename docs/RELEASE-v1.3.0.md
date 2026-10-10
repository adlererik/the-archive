# The Archive v1.3.0 — One link to share your memories

By **Erik Adler** · October 10, 2026 · MIT-licensed source release.

A self-hosted Instagram replacement for your personal photos, videos, and memories. Keep the originals on your own server, curate them in a built-in CMS, and share a mixed photo/video presentation with one short URL.

## Why Erik built this

Erik wanted ownership of his memories beyond Instagram's walled garden. In his experience, Pixelfed was too limited and clunky for the workflow he wanted. The Archive combines a focused gallery, original-file preservation, fast browsing, easy family sharing, and TV playback. These are concrete reasons it suits his workflow better; it does not claim universal superiority over every gallery or provide a full social network.

The existing project screenshots remain in the [README](../README.md). Fresh installations start empty with their own media and unique credentials.

## New since v1.2.0

- **One short URL for a compilation:** save individual photos/videos in Favorites, arrange their order, choose photo duration and Repeat, and send a presentation link. Recipients need no account; photos advance and videos play to completion.
- **Direct media links:** a paper-plane Send to icon shares the selected photo/video. Copy link, Email, Message, and native device sharing are offered where supported.
- **Recipient controls and previews:** native video scrubbing, play/pause, speed, fullscreen where supported, presentation seeking, and first-item thumbnail metadata for compatible messaging apps. Sound is requested by default, with a browser-required Tap for sound/Play fallback.
- **Discreet gallery controls:** small top-right Cast/Send/Favorite/Volume icons, 37.5%-opacity backgrounds, matching tappable carousel counter, and a three-second inactivity fade. Movement, touch, or keyboard focus reveals controls; open menus remain available.
- **Organized administration:** separate top-right lock/logout; square-plus for A new chapter uploads; far-right cogwheel for visitor history, header settings, login choices, and the handbook.
- **Persistent visitor history:** public IPs, country flags, approximate city, OS/device/browser, and paginated history. Local and recognized owner browser/IP visits are excluded. Delete one record or all history manually; there is no scheduled pruning.
- **Simple default login:** fresh setup explicitly uses CMS username/password with unique generated credentials and local recovery. No Cloudflare account or biometric device is needed.
- **Optional owner identity login:** owners who configure Cloudflare Access can skip the CMS password form. Signed JWT verification checks the configured issuer, audience, exact owner email, hostname, and expiry. Google or Cloudflare account sign-in, Apple-related social login, and device passkeys depend on provider configuration and device support.
- **Documentation refresh:** updated beginner setup, sharing and visitor guides, migration/backup requirements, feature overview, and an Instagram replacement introduction. Private installation data remains excluded from source downloads.

## Everything included

Continuous chronological wall; captions/dates and configurable age labels; virtualized all-media thumbnail grid with year jumps and scroll restoration; carousel swipe/counter/thumbnail navigation; desktop theater and mobile native video; five themes; per-item Favorites and post hearts; local/TV presentations; Google Cast and native AirPlay; carousel reordering/add/remove; backdated uploads and insertion; soundtracks with trim/volume/loop; header/account settings; persistent visitor statistics; local Instagram export import; original-file preservation and compatible playback generation; Debian boot services; optional HTTPS/domain integration; private backups and migration guides.

Google Cast queues run on a compatible receiver; AirPlay presentation advancement depends on the sender page remaining active. A Cast-only receiver does not automatically support AirPlay. Browsers may require one tap for audible autoplay. See [all features](FEATURES.md), [sharing](SHARING.md), and [casting](FAVORITES-CASTING.md).

## Install

Start with the [beginner walkthrough](BEGINNER-GUIDE.md). Supported path: Debian/Ubuntu Linux, Node.js 24+, pnpm 12.10.1, FFmpeg/FFprobe, Git, and Bash. Run setup as a normal user.

```bash
git clone --branch v1.3.0 https://github.com/adlererik/the-archive.git
cd the-archive
./archive setup
./archive start
```

Open `http://localhost:3000` on that computer, or the printed LAN address on another device. Username: `admin`; read the generated password privately from `.env.local`. Use the top-right lock or `/admin/login`. Keep Username & password selected; Cloudflare is optional. Use square-plus to upload and the cogwheel to personalize the header/login and read the guides.

Downloadable source ZIP/tarball assets include checksums in `SHA256SUMS`. They contain source, guides, schema, and the dependency lockfile. Dependencies install during setup.

## Upgrade and preserve sent URLs

v1.3.0 adds no database schema changes compared with v1.2.0. Older versions need the optional soundtrack fields introduced in v1.2.0. Stop the site, record the old revision, and privately back up the database, uploads, environment files, and existing runtime configuration/shared links before updating.

```bash
git fetch origin --tags
git checkout v1.3.0
./archive install
# For versions older than v1.2.0, review and apply the schema:
pnpm db:push
```

Never accept a destructive database reset or use `--accept-data-loss`. Build/start for a foreground installation, or use the documented systemd rebuild helper. Existing credentials and login mode are preserved; the password default applies to fresh installs. The build fallback does not undo database/source changes. [Upgrade instructions](PUBLIC-SETUP.md).

Preserve `.runtime/shared-links/`, database, uploads, and a stable hostname so previously sent links keep working. Also back up private `.runtime/admin-auth.json` and `.runtime/visitor-exclusions.json` when present. [Operations](OPERATIONS.md).

## Privacy and costs

No actual passwords/tokens, private account settings, original media, populated databases, visitor records, private backups, runtime binaries, or compiled build are distributed. Intentionally published README screenshot references are retained. Gallery/media/share URLs are public; Admin and visitor IPs require authentication. History remains until manually deleted.

The MIT-licensed CMS requires no paid sharing API, URL shortener, or CMS subscription. Your hosting, storage, electricity, Internet, domain, receiver hardware, and optional external services remain separate costs. Optional Cloudflare Free limits and identity/device requirements are described in [Administration](ADMIN.md). A paid Apple developer integration or custom QR approval service is not part of this release.

See [verification notes](VERIFICATION.md) for the checks performed and physical-device limits. This project is independent of Instagram/Meta and other named products.
