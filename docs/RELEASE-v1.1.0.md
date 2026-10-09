# The Archive v1.1.0 — Your self-hosted Instagram alternative

By **Erik Adler**. MIT-licensed public source release.

Run your own photo/video home: a continuous Instagram-style wall, cinematic viewing, personal favorites, and media-only TV casting. The CMS and original files live on your own computer or server. This release includes the all-media thumbnail wall and all earlier casting, carousel, playback, and administration improvements.

## New since v1.0.0

- **Every-media thumbnail wall:** browse every photo/video, including carousel contents, in a dense responsive grid.
- **Jump to year:** find older memories quickly without paging through the timeline.
- **Quick favorites:** star individual thumbnails to build a TV presentation.
- **Exact-item viewing:** open the selected carousel item on mobile or desktop and return to the same browsing position.
- **Beginner walkthrough:** copy-and-paste Linux installation, first login/upload, boot startup, HTTPS/domain setup, casting, backups, upgrades, and migration.
- **Full feature guide:** explain what each part of the gallery/CMS does and its practical requirements.
- **Admin Info updates:** the new guides and Cloudflare instructions are available inside management.
- **Portable public documentation:** replace installation-specific domain/account/network examples; domain research accepts the reader's own candidates.

## Included features

- Continuous reverse-chronological timeline, captions, dates, configurable milestone ages, and photo/video carousels.
- Consistent left/right swipes, wall thumbnail selection, desktop theater, and native mobile video controls.
- Visibility-managed playback, one active local video, discreet mute toggle, and requested audio by default.
- Gold and Graphite studio themes with black backgrounds and thin gold outlines.
- Post hearts and individual-media favorites, reordering, timed presentations, complete video playback, and repeat.
- Media-only Google Cast from wall/viewer overlays; mixed favorites queues run on the receiver.
- Public HTTPS media-origin fix, receiver load errors, photo-slide preparation, streaming ranges, and media CORS support.
- Authenticated uploads, backdating, caption/date edits, deletion, header customization, and username/password changes.
- Local visitor statistics with approximate city/device/OS/browser information and reset controls.
- Local Instagram export import, caption encoding repair, SQLite persistence, filesystem media, previews, and compatible video copies.
- Foreground controls, port-conflict protection, Debian boot services, reusable Cloudflare tunnel service, backups, and previous-build fallback.

See the [complete feature guide](FEATURES.md) for details.

## Install step by step

Use the [beginner guide](BEGINNER-GUIDE.md) if you are new to servers. The first supported setup uses Debian/Ubuntu Linux with Node.js 24+, pnpm 12.10.1, FFmpeg/FFprobe, Git, and Bash.

Once those tools are installed:

```bash
git clone --branch v1.1.0 https://github.com/adlererik/the-archive.git
cd the-archive
./archive setup
./archive start
```

Open http://localhost:3000. Sign in at /admin/login as `admin`, using the random password generated in your private `.env.local`, and upload your own memories. Setup creates an empty database and unique credentials for your installation.

Downloads include source ZIP and tarball packages with SHA-256 checksums. Dependencies are installed during setup. No personal media, passwords, tokens, databases, visitor records, private environment files, runtime binaries, or compiled build are shipped.

## Upgrade from v1.0.0

Make a private backup of your database, uploads, and environment files first. Record the old revision. This release requires **no database schema change**.

```bash
git fetch origin --tags
git checkout v1.1.0
./archive install
```

For the foreground launcher, stop/build/start. For the Debian boot service, run `sudo bash deploy/rebuild-archive-root.sh "$USER"` from the checkout. See [upgrade and migration instructions](PUBLIC-SETUP.md).

## Requirements and limits

- Google Cast needs supported Chrome, HTTPS, a compatible receiver, network discovery, and TV-reachable media. Physical TV casting after the earlier HTTPS fix was confirmed by the project owner; not every receiver or queue combination has been checked.
- Browsers can require a tap before audible autoplay. Sound requested by default cannot override device/browser policy.
- Favorites and theme preferences belong to the current browser and hostname.
- City estimates can be missing or inaccurate. Customize your deployment's privacy notice.
- The published gallery/media are public; Admin requires login.
- A permanent domain uses a named tunnel. Quick Tunnel addresses change after restart.
- This is application source, not a hosted service. Owners maintain their storage and private backups.

Instagram is a trademark of its owner. This independent project is not affiliated with Instagram or Meta.

## Release verification

A fresh source installation completed the production build and TypeScript checks. Gallery, favorites, login, and API checks passed; the new installation contained no posts or media. Generated settings were private, and admin authentication worked. Tracked files, Git history, and source downloads were audited for private file paths and credentials. See [verification notes](VERIFICATION.md).
