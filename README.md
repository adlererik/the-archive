# The Archive

By Erik Adler.

A local photo and video preservation suite: an editorial timeline, full-screen media viewer, carousel previews, authenticated administration, and visitor statistics. Built with Next.js, TypeScript, Tailwind, Framer Motion, Lucide, Prisma, and SQLite.

## Run locally

Requirements: Node.js 24 or newer, pnpm, FFmpeg and FFprobe.

```bash
cp .env.example .env.local
# Set your admin password, session secret, and birth date in .env.local.
./archive install
pnpm db:push
./archive build
./archive start
```

Open `http://localhost:3000`. The server binds to `0.0.0.0` so devices on the same network can connect. Keep your firewall and router settings appropriate for your chosen access.

Use `./archive stop`, `./archive restart`, and `./archive status` to manage the server. See [operations](docs/OPERATIONS.md) for migration, backups, updates, and boot startup.

## Data stays outside Git

Personal uploads, thumbnails, playback copies, SQLite databases, visitor records, local environment files, backups, import exports, screenshots, and runtime credentials are excluded by `.gitignore`. A clone contains the application source and documentation. Transfer your database and uploads separately when migrating.

Instagram exports are parsed locally by `scripts/import-instagram.ts`; no Instagram credentials are required for export import. Set `INSTAGRAM_EXPORT_DIR` to the extracted export directory and run `pnpm import:instagram`. Use `--latest=5` when selecting the five newest export posts.

## Administration

Visit `/admin/login`. The initial username comes from `ADMIN_USERNAME`; the initial password comes from `ADMIN_PASSWORD`. Change both through Login settings. Existing database account settings take precedence over environment defaults. `./archive reset-login` provides local account recovery.

The site stores local visitor statistics for its administrator. Public IP city estimates can be unavailable or inaccurate; local IPs are not stored. Favorites and casting documentation is maintained with the features.

## Project notes

[Architecture](docs/ARCHITECTURE.md) describes storage, authentication, and streaming. Major source changes are committed with Erik Adler as the author. No personal archive content should be added to this repository.
