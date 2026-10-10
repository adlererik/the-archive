# The Archive

### A self-hosted Instagram replacement for your photos, videos, and memories

By **Erik Adler** · Latest release **v1.2.0** · [MIT license](LICENSE)

Publish your own photo and video collection on a website you control. The Archive combines an Instagram-style chronological wall with a cinematic gallery, fast thumbnail browsing, favorites, presentations, and Google Cast / AirPlay. Your original media and database live on your own computer or server.

It focuses on personal galleries and media preservation: viewers can browse memories, give hearts, save favorite photos and videos, and put them on a television. You manage uploads, captions, dates, your gallery header, and your login from the built-in CMS.

## Why I developed this

By Erik Adler:

> I wanted a home for my memories that I could own and run myself. Instagram is a walled garden. I tried Pixelfed, but in my experience it was too limited, felt clunky, and did not work well for what I needed. I built The Archive to preserve my original photos and videos, present them beautifully, find older memories quickly, and share them on a TV without depending on a social platform.

This is Erik's experience and opinion. The Archive replaces a personal photo-sharing and preservation workflow; it is not a full Instagram clone or a federated social network. There are no follower feeds, direct messages, or viewer accounts.

## Start here

**New to servers or the terminal? Follow the [beginner walkthrough](docs/BEGINNER-GUIDE.md).** It explains installation, your first login and upload, TV casting, public HTTPS, boot startup, upgrades, and backups one step at a time.

- [Download v1.2.0](https://github.com/adlererik/the-archive/releases/tag/v1.2.0)
- [Complete feature guide](docs/FEATURES.md)
- [Installation and deployment reference](docs/PUBLIC-SETUP.md)
- [Favorites and casting guide](docs/FAVORITES-CASTING.md)
- [Release notes](docs/RELEASE-v1.2.0.md)

## What you can do

| Feature | What it gives you |
| --- | --- |
| Continuous timeline | Newest memories first, seamless older-post loading, captions, dates, and configurable milestone ages. |
| Every-media thumbnail wall | A compact grid of every image and video, including carousel contents; jump to a year and return to the same scroll position after viewing. |
| Carousel browsing | Swipe left for next, right for previous; use thumbnail previews for direct selection. |
| Desktop theater | A large media viewer with full captions, audio, media navigation, and keyboard controls. |
| Mobile playback | Inline photos/videos and native video controls, with playback following the visible item. |
| Controlled sound | Sound requested by default, a small speaker toggle, and one active local video to avoid overlapping audio. |
| Google Cast / AirPlay | One unchanged Cast overlay sends selected media through Google Cast in Chrome or native AirPlay in Safari, including directly from the wall. |
| Personal favorites | Save individual carousel photos/videos, reorder them, and build a presentation. |
| TV presentations | Timed photos and complete videos, optional repeat; Google Cast receiver queues or page-driven AirPlay presentations. |
| Hearts | Visitors can like a whole post separately from saving individual favorites. |
| Five gallery themes | Gold (default), Graphite, Porcelain (light), Midnight, and Verdant, with original media colors and restrained gold hairlines. |
| Carousel curation | Reorder, add, or remove individual assets; turn single posts into carousels; insert at any timestamp. |
| Post soundtracks | Audio uploads, preview, trim, volume, loop, original-video audio settings, and soundtrack-bearing cast files. |
| Built-in CMS | Drag-and-drop uploads, multi-file carousels, backdated memories, and inline caption/date editing. |
| Custom header and login | Change the title, introductory text, username, and password from Admin. |
| Visitor statistics | Approximate city/country, device, OS/browser, and counts, with a clear-all action. |
| Instagram export import | Bring your own downloaded export, preserving dates and carousel order and repairing common caption encoding issues. |
| Local preservation | Original files, SQLite data, generated previews, compatible video copies, and direct byte-range media streaming. |
| Your own server and domain | Debian boot services, Cloudflare HTTPS/tunnels, backup/migration guidance, and release-based upgrades. |
| Documentation in Admin | Beginner, feature, operations, and casting guides are available from the Info panel. |

See [all features and their limits](docs/FEATURES.md).

## Quick installation

These commands install the stable **v1.2.0** release. The beginner guide walks through installing the required tools first.

Supported starting point: **Linux**, **Node.js 24+**, **pnpm 12.10.1**, **FFmpeg / FFprobe**, **Git**, and **Bash**. The beginner guide includes copy-and-paste Debian/Ubuntu prerequisite commands.

```bash
git clone --branch v1.2.0 https://github.com/adlererik/the-archive.git
cd the-archive
./archive setup
./archive start
```

Open [http://localhost:3000](http://localhost:3000). Setup installs locked dependencies, creates an **empty** SQLite database, generates a unique admin password and session secret, and builds the application. The initial username is **admin**. Read your generated password from private `.env.local`, sign in at `/admin/login`, and upload your own media.

A release download contains source code, documentation, schema, and lockfile. Dependencies are installed during setup. Source ZIP/tarball checksums are supplied with the release.

## Start, stop, restart

Run these inside the project folder:

```bash
./archive status
./archive stop
./archive build
./archive start
./archive restart
```

The default listener is `0.0.0.0:3000`; Wi-Fi devices can use your computer's LAN address. A busy port produces an error instead of silently launching a duplicate site on 3001. Keep the start terminal open for a foreground installation, or use the documented Debian boot service.

## Import an Instagram export

Extract your export locally, then run:

```bash
INSTAGRAM_EXPORT_DIR="/path/to/your/extracted-export" pnpm import:instagram
```

The importer reads JSON directly from disk, preserves timestamps/carousels, fixes common caption encoding, and copies your media into `public/uploads/`. Existing imported source IDs prevent duplicate imports. Import only files and media you are entitled to use.

## Playback and casting requirements

The same Cast button uses Google Cast in supported Chrome and Safari’s native AirPlay picker on Apple devices. Casting needs a compatible receiver, an HTTPS gallery, and media the TV can fetch. AirPlay presentation advancement depends on the sender page remaining active. Only selected media or a favorites queue is sent to the TV. Photos are converted locally to still-image MP4 slides; FFmpeg is required.

Browsers can require a tap before allowing audible autoplay. The gallery requests sound by default and provides a discreet speaker control and native mobile video controls. Favorites and theme preferences are stored per browser and site address.

## Privacy and ownership

**Passwords, session/tunnel tokens, personal media, populated databases, visitor records, environment files, private backups, screenshots, runtime binaries, and build output are excluded from release downloads.** Each new installation starts empty and generates its own credentials.

The gallery is public wherever you publish it; Admin requires login. Keep your private backups separate, use HTTPS for public access, and customize the included visitor privacy notice for your installation. See [security guidance](SECURITY.md), [administration](docs/ADMIN.md), and [operations](docs/OPERATIONS.md).

Built with Next.js, TypeScript, Tailwind CSS, Framer Motion, Lucide, Prisma, and SQLite. Application source is MIT licensed. Instagram is a trademark of its owner; this project is independent and is not affiliated with Instagram or Meta.

[Carousel editing, soundtracks, and themes](docs/CAROUSELS-SOUNDTRACKS-THEMES.md) includes the database upgrade step. See the [changelog](docs/CHANGELOG.md) for release history.
