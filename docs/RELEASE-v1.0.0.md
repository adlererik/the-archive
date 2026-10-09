# The Archive v1.0.0

Public source release by Erik Adler, licensed under MIT.

## Included

- Editorial continuous timeline with images, videos, ordered carousels, milestone ages, and Gold/Graphite themes.
- Corrected swipe direction; carousel previews and direct selection on the wall; no redundant wall arrows or “Click to view” labels.
- Mobile native video controls, visible-media playback management, sound requested by default, and a discreet speaker toggle. Browser audio permission still applies.
- Media-only Google Cast from the wall/viewer and favorites presentations. Fixed public HTTPS origin selection so receivers fetch media rather than the internal server address. Fresh Cast configuration, ordinary single-video loads, receiver errors, byte-range streaming, and CORS support are included.
- Individual favorites, ordering, presentation playback, and Cast queues.
- Admin uploads, inline edits, header customization, username/password changes, visitor city/device information, clear-statistics action, hearts, and documentation.
- Local Instagram export ingestion, caption encoding repair, SQLite persistence, media processing, and filesystem streaming.
- Foreground server controls on port 3000, Debian boot service, recoverable production rebuild, and reusable Cloudflare tunnel service.
- Fresh-install setup that generates unique credentials and an empty database, portable deployment settings, and public installation/security documentation.

## Install

Install Node.js 24+, pnpm 12.10.1, FFmpeg/FFprobe, Git, and Bash on Linux. Clone the repository or extract a source archive, then run `./archive setup` and `./archive start`. Open `http://localhost:3000`; read your generated initial password from private `.env.local` and sign in as `admin`.

Release ZIP and tarball contain source, lockfile, schema, documentation, and license only. No passwords, tokens, personal media, database contents, visitor records, runtime binaries, or compiled build are included. `SHA256SUMS` covers the downloadable source packages. Dependencies and prerequisites are installed on your own machine.

## Verification and limits

The physical Android Chrome/TV casting fix was confirmed working by the project owner. Source history and release packages are audited for credentials and private files. Fresh-clone compilation and startup are checked separately from the original private gallery; see verification notes for the recorded results.

Sound is requested by default, but browsers can require user interaction before allowing unmuted autoplay. Cast requires supported Chrome, HTTPS, a compatible receiver, and TV-reachable media. Favorites are local to each browser. City estimates may be missing or inaccurate. Quick Tunnel hostnames change after restart. This release provides no hosted service or included media.

See README, docs/PUBLIC-SETUP.md, SECURITY.md, and docs/FAVORITES-CASTING.md before deployment. Existing users should back up their private database, uploads, and environment files before upgrading.
