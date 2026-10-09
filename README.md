# The Archive

By **Erik Adler** · [MIT license](LICENSE)

A self-hosted photo and video gallery with an editorial timeline, carousel previews and swipes, a desktop theater, browser-local favorites, photo/video presentations, media-only Google Cast, authenticated administration, and visitor statistics. Built with Next.js, TypeScript, Tailwind, Framer Motion, Lucide, Prisma, and SQLite.

## Get started

Linux prerequisites: **Node.js 24+**, **pnpm 12.10.1**, **FFmpeg / FFprobe**, Git, and Bash. Install pnpm with `npm install -g pnpm@12.10.1`; on Debian, install FFmpeg with `sudo apt-get install ffmpeg`. Obtain Node from [nodejs.org](https://nodejs.org/en/download).

```bash
git clone https://github.com/adlererik/the-archive.git
cd the-archive
./archive setup
./archive start
```

Open [localhost:3000](http://localhost:3000). Setup installs the locked dependencies, creates an **empty** SQLite database, generates a unique admin password and session secret in private `.env.local`, and builds the application. Read your password from that file locally; the initial username is `admin`. Sign in at `/admin/login`, then upload your own photos and videos. Change the username, password, and gallery header in Admin.

Set `NEXT_PUBLIC_BIRTH_DATE` in `.env.local`, then rebuild to change milestone ages. Setup preserves existing environment files and does not automatically accept destructive database changes. It never includes the author's archive, credentials, or visitor records.

Prefer a download? Use the source ZIP or tarball on the [Releases page](https://github.com/adlererik/the-archive/releases). Extract it, install the prerequisites above, then run `./archive setup` and `./archive start` inside the folder. Release checksums are provided.

## Features

- Continuous chronological photo/video wall with carousel previews and touch swipes.
- Toggle a dense thumbnail wall containing every carousel image/video, jump to a year, and save individual Favorites directly. Closing the viewer restores the same browsing position.
- Video playback follows the visible media; sound is requested by default, with a discreet mute control. Browsers can require a tap before allowing audio.
- Gold and Graphite gallery themes; black backgrounds and thin gold outlines remain intact.
- Favorites for individual images/videos, ordered presentations, and media-only Google Cast.
- Mobile native video controls without oversized controls covering the picture.
- Admin upload, caption/date editing, deletion, header customization, and account settings.
- Local visitor statistics with approximate city/device/browser information, no stored local IPs, and a clear-statistics action.
- Local Instagram export import, filesystem media streaming, thumbnails, and video processing.

## Manage your installation

```bash
./archive status
./archive stop
./archive build
./archive start
# Restart an already running launcher:
./archive restart
```

The default listener is `0.0.0.0:3000`. A busy port produces an error instead of silently starting a duplicate site on port 3001. `ARCHIVE_PORT` can override the port explicitly. Keep the start terminal open, or install the Debian systemd service for unattended operation.

See [public setup and deployment](docs/PUBLIC-SETUP.md) for installation, updates, backups, migration, boot startup, and Cloudflare. [Operations](docs/OPERATIONS.md) includes the original installation's examples; replace its account and paths with your own.

## Casting and mobile playback

Open the sender in a supported Chrome browser over **HTTPS**. The TV must be able to fetch the selected media from that HTTPS URL. The casting fix uses the browser's public origin by default, rather than the server's internal listening address. It refreshes configuration before each load and displays receiver errors. Optional `CAST_MEDIA_ORIGIN` must point to another TV-reachable media host, if used.

Cast needs a compatible receiver. Photos are prepared as MP4 slides; FFmpeg is required. Browser autoplay restrictions cannot be overridden by the site: if unmuted autoplay is blocked, tap Play or the speaker control once. See [favorites and casting](docs/FAVORITES-CASTING.md).

## Import your own archive

Extract an Instagram export locally, set `INSTAGRAM_EXPORT_DIR` to its directory, then run `pnpm import:instagram`. The importer reads the JSON from disk, fixes common caption encoding problems, preserves dates/carousel order, and copies media into `public/uploads/`. No Instagram credentials are needed. See [architecture](docs/ARCHITECTURE.md).

## Privacy, security, and license

Uploads, thumbnails, playback copies, SQLite databases, environment files, backups, export manifests, screenshots, and runtime credentials are excluded from Git and release packages. Back them up separately. Favorites are saved in each viewer's browser. Visitor statistics belong to the installation's private database; adapt the included `/privacy` notice to your deployment.

Use HTTPS and your own strong credentials before public hosting. See [security guidance](SECURITY.md), [administration](docs/ADMIN.md), [development](docs/DEVELOPMENT.md), and [verification notes](docs/VERIFICATION.md). Application source is MIT licensed; supply only media you have permission to use.
