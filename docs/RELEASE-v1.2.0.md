# The Archive v1.2.0 — Curate your memories, share them on your TV

By **Erik Adler** · October 10, 2026 · MIT-licensed source release.

A self-hosted replacement for your personal Instagram photo-sharing and preservation workflow: keep original photos/videos on your own server, browse a beautiful gallery, curate carousels and soundtracks, and present favorites on a TV.

## Why this was developed

Erik wanted control over his memories beyond Instagram's walled garden. He tried Pixelfed but, in his experience, found it too limited, clunky, and unsatisfactory for his needs. The Archive reflects that personal experience: a focused gallery and CMS with fast browsing, original-file preservation, and TV presentations. It is not a full Instagram clone or a federated social network.

## Changelog: new since v1.1.0

- **Carousel editing:** reorder existing media by drag/drop or move buttons; add/remove individual photos/videos; turn a single post into a carousel.
- **Insert anywhere:** new memories accept any timestamp; Insert here suggests a date beside an existing memory. Retained media IDs, hearts, and concurrent-edit detection protect curation.
- **Post soundtracks:** drag/drop audio, preview, trim, volume, loop, replace/remove, and original-video audio choice. Prepare media with sound for TV playback.
- **Three additional themes:** light Porcelain, indigo Midnight, and forest Verdant join default Gold and Graphite.
- **Native AirPlay:** the existing Cast icon now supports Apple Safari as well as Chrome Google Cast, with the same appearance and position.
- **AirPlay handoff correction:** prefer the displayed playing video, preserve its position, start playback within the original tap, and retain native ownership through local visibility/player recycling.
- **Public documentation:** complete feature guide, updated beginner walkthrough, creator motivation, migration notes, and source-only downloads with checksums.

## Everything included

Continuous newest-first timeline; milestone ages and captions; all-media virtualized thumbnail wall with year jumps and scroll restoration; swipe/thumbnail carousel browsing; desktop theater and mobile native controls; visibility-managed video and discreet sound toggle; hearts and per-asset browser-local Favorites; ordered/timed/repeating photo/video presentations; Google Cast and AirPlay media-only output; five themes; secure username/password Admin; backdated uploads, carousel curation, soundtracks, header/account editing; approximate visitor city/device/OS statistics and reset; local Instagram export import; original files, SQLite, preview/compatible media generation; Debian boot startup; Cloudflare HTTPS/domain guides; private backups and migration documentation.

See the [complete feature guide](FEATURES.md) and [changelog](CHANGELOG.md).

## Install: beginner steps

The [beginner walkthrough](BEGINNER-GUIDE.md) explains Terminal, prerequisites, installation, your first upload, TV setup, boot startup, HTTPS, and maintenance. Supported starting point: Debian/Ubuntu Linux, Node.js 24+, pnpm 12.10.1, FFmpeg/FFprobe, Git, and Bash.

After installing those tools:

```bash
git clone --branch v1.2.0 https://github.com/adlererik/the-archive.git
cd the-archive
./archive setup
./archive start
```

Open **http://localhost:3000**. Keep that terminal open until configuring the boot service. Setup creates an **empty** gallery with unique private credentials. Read the generated password in `.env.local`, then sign in at `/admin/login` as **admin**. Change the login in Admin and upload your own memories. Use your server's LAN address instead of localhost from another device.

Alternatively extract the source ZIP/tarball and run the same setup/start commands inside it. Dependencies install during setup. Compare downloads with `SHA256SUMS`; never run a file that fails its checksum.

## Upgrade from v1.1.0 or v1.0.0

**Database change:** optional soundtrack columns are added to Post. Stop the site, record the old revision, and privately back up SQLite, uploads, `.env`, and `.env.local` before proceeding.

```bash
git fetch origin --tags
git checkout v1.2.0
./archive install
pnpm db:push
```

Put your Node/pnpm installation on PATH if needed. Review the schema output: do not reset the database or use `--accept-data-loss`. Then `./archive build` and `./archive start` for a foreground installation, or `sudo bash deploy/rebuild-archive-root.sh "$USER"` for the boot service. The helper's previous-build fallback does not undo schema/source changes. See [upgrade/migration reference](PUBLIC-SETUP.md).

## Privacy and practical limits

Only source, guides, schema, and lockfile are distributed. No personal media, passwords, tokens, populated database, visitor records, private environment files, screenshots, backups, runtime binaries, or compiled build are included. New users supply their own media and receive their own credentials.

The gallery is public when published; Admin is authenticated. Protect your backups and customize the visitor privacy notice. Favorites/themes are browser-and-hostname local.

Browsers may require a tap before audible autoplay. Google Cast needs a compatible receiver; Safari needs an AirPlay-compatible receiver. Use receiver-reachable HTTPS media. Google queues run on the receiver; keep Safari active for AirPlay slideshow advancement. A Chromecast-only TV is not automatically AirPlay-compatible.

The owner confirmed Android Google Cast and the earlier AirPlay implementation on compatible TVs. The latest AirPlay handoff has build/deployment checks; physical confirmation of that revised handoff and every soundtrack/receiver combination is not claimed. See [verification notes](VERIFICATION.md).

Instagram and Pixelfed names identify independent products; this project is not affiliated with them.
