# The-Archive — Codex project guidance

## What this project is

The Archive is Erik Adler's self-hosted photo/video gallery, preservation suite, and CMS. He developed it to own his memories beyond Instagram's walled garden; in his experience Pixelfed was too limited and clunky for his needs. It replaces a personal gallery workflow, not a full social network.

Read README.md, docs/FEATURES.md, and docs/CHANGELOG.md before making substantial changes. Stable public release: v1.3.0. Detailed guides cover beginner setup, administration, carousels/soundtracks/themes, favorites/casting, operations, Cloudflare, and verification.

## Architecture and behavior to preserve

- Next.js App Router, TypeScript, React, Tailwind, Framer Motion, Lucide; Prisma/SQLite and local filesystem media.
- Reverse chronological timeline; all-media virtualized thumbnail wall with year jumps and scroll restoration; individual Favorites, hearts, and presentations.
- Curatable carousels, timestamp insertion, post soundtracks, and five themes. Gold is the default. Preserve original media colors.
- Swipe left advances, swipe right goes back. The normal mobile wall stays inline; desktop supports the theater, and thumbnail mode opens exact items on either.
- Sound is requested by default. Respect deliberate mute and browser permission limits. Stop or transfer local playback as viewing changes; prevent overlapping video audio.
- Preserve the single Cast control and the documented top-right media icon column, inactivity fade, and accessible counter. Chrome uses Google Cast; Safari uses native AirPlay. Handed-off native players must not be paused/muted/recycled by local visibility guards.
- Google Cast queues run on the receiver; AirPlay presentation progression depends on the sender page. Build checks do not prove physical receiver behavior.
- Default password login, optional configured identity login, separate settings/upload menus, persistent visitor statistics/deletion, public sharing links, uploads, and in-place editing must remain authenticated. Gallery/media are public by design.

## Privacy, source control, and releases

Never commit or publish media, populated SQLite files, visitor records, private environment files, passwords, session/tunnel tokens, authentication files, screenshots, private backups, or credential-bearing logs. Respect .gitignore. Publish releases from audited Git source, not the working directory; provide source archives and checksums. Attribute project commits to Erik Adler using the configured GitHub noreply identity.

Use the locked dependencies and supported Node.js version. v1.2.0 adds optional soundtrack columns; back up existing data before schema updates. Never reset an existing database or accept data loss without explicit authorization. Do not overwrite an installation's environment or account settings.

## Working here

Use ./archive setup only for a fresh installation. See docs/PUBLIC-SETUP.md for upgrades and deployment. Default port is 3000; do not create a second site on 3001 to avoid a conflict. Rebuild before restarting source changes. A systemd build rollback does not roll back SQLite or Git.

When present, work/project/CODEX-CONTEXT.md contains local deployment context. It is private, ignored, and must not enter public source/release packages. Do not infer that a local build is deployed to the server. Report verified facts and any remaining real-device limitations.
