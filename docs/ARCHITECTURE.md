# Architecture

By Erik Adler.

The application uses the Next.js App Router and a custom Node HTTP server. The custom server streams media directly from disk, including files added after server startup, and supports HEAD and byte-range requests for phone and TV playback.

SQLite lives at `prisma/dev.db`. Posts have publication timestamps, captions, and ordered media items. Original uploads live at `public/uploads/`; generated thumbnails and H.264/AAC MP4 playback files are retained alongside originals. Original media is preserved during video conversion.

The wall is reverse chronological and loads additional records through a timestamp/id cursor. Intersection observers limit mounted heavy media; videos play only when hovered or opened, and playback ownership prevents overlapping hover audio.

Admin authentication uses a signed HTTP-only cookie and salted scrypt password hashes in the database. Changing login credentials invalidates prior sessions. Public readers do not receive admin editing controls. Configure an unpredictable session secret and your own password before server deployment; enable secure cookies behind HTTPS.

Visitor statistics are stored locally for 90 days. Public-IP location lookup uses a local GeoIP database. Private IP addresses are discarded. Hearts use a signed visitor cookie. Source control contains no archive data or secrets.
