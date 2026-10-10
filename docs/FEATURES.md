# Complete feature guide — v1.2.0

By Erik Adler. See the [beginner guide](BEGINNER-GUIDE.md) to install and the [changelog](CHANGELOG.md) for version history.

## Your gallery, your files

The Archive is a self-hosted replacement for a personal Instagram photo-sharing and memory-preservation workflow. You run the application on your own computer/server and keep its original files and SQLite database. It is a gallery and CMS, not a federated network: no follower feeds, direct messages, viewer accounts, or automatic off-site backups.

Erik developed it because he wanted an alternative to Instagram's walled garden. In his experience, Pixelfed felt too limited and clunky for this purpose. That is the creator's opinion; this project concentrates on the gallery, preservation, and TV presentation tools he wanted.

## Browse and find memories

- **Continuous timeline:** newest first, older memories loaded as you scroll, without page or Load More buttons. Responsive four/two/one-column layout.
- **Dates and captions:** readable captions, exact dates in the viewer, and milestone age calculated from your configured birth date.
- **All-media thumbnail wall:** switch to a dense, virtualized grid containing every photo/video, including individual carousel items. Static lazy previews avoid loading every full video.
- **Find a year:** jump to older memories; open the exact selected item and return to the same scroll position. Timeline and thumbnail modes preserve separate browsing positions.
- **Carousel previews:** swipe left for next and right for previous, or select a thumbnail directly. Expanded thumbnail previews reveal carousel contents. The full viewer returns to the wall after advancing past the last item; wall previews cycle within their carousel.
- **Desktop theater:** large photo/video presentation with full caption, date, age, navigation, keyboard support, and a clear Close button.
- **Mobile viewing:** normal-wall media remains inline with native video controls; the thumbnail wall can open an exact item for inspection. Controls avoid covering the picture with giant persistent buttons.

## Video and sound

One visibility-managed local wall video follows the viewed item, with desktop hover priority and carousel selection. Playback stops or transfers as viewing changes, avoiding overlapping video audio. Theater/Favorites playback follows visibility and tab activity. Sound is requested by default; the discreet speaker toggle respects deliberate mute.

Browsers and phones can require a tap before audible autoplay. Neither this app nor a website can guarantee unmuted playback without permission. Native controls remain available. FFmpeg creates posters and compatible playback copies while retaining original uploads; conversion depends on the source file and server resources.

## Favorites, hearts, and presentations

- A heart likes a whole post. A favorite star saves one specific image/video, including carousel items.
- Save quickly from the thumbnail wall, then view, reorder, and remove items in Favorites.
- Present favorites with adjustable photo duration, full video playback, pause/resume, and optional repeat.
- Favorites and themes are stored in the current browser for that hostname. They do not synchronize between devices or domains and are not part of server backups. Deleted media may appear as unavailable in an older saved list.

## One Cast button, two TV systems

The same existing overlay sends the selected media, not your webpage:

| Sender | Receiver and behavior |
| --- | --- |
| Supported Android/desktop Chrome | Google Cast / Chromecast-compatible receiver; media loads and Favorites queues run on the receiver. |
| iPhone/iPad/Mac Safari with native picker support | AirPlay-compatible receiver; opens `webkitShowPlaybackTargetPicker()` from the original button tap. Favorites advancement is controlled by the active sender page. |
| Browser with neither API | Casting control is unavailable. |

Safari prefers the displayed video, retains its position, initiates playback before opening the picker, and protects the handed-off player from local pause/recycling rules. Photos or soundtrack composites use a native transport. There is no second icon or changed overlay position.

Casting requires a compatible TV/receiver, network discovery, and receiver-reachable media; use public HTTPS for the supported deployment. A Chromecast-only TV is not automatically an AirPlay TV. Still photos are prepared as MP4 slides. Soundtrack-bearing media is prepared as compatible MP4. Google queues can continue on the receiver; Safari slideshow progression can stop if its page is suspended. See [Favorites and casting](FAVORITES-CASTING.md).

## Curate posts and carousels

- Secure Admin uploads: drag/drop JPG/JPEG/PNG/WebP photos and MP4/MOV videos; multiple files make a carousel.
- Choose any date/time to backdate a memory or insert it at any point in the timeline. **Insert here** offers a nearby starting timestamp.
- Edit captions and dates directly from authenticated wall controls.
- Reorder existing assets by dragging or accessible move controls, add files, remove individual items, and turn a single post into a carousel. Undo a draft removal before saving; keep at least one item.
- Save the complete edit together; competing edits are detected. Retained media IDs preserve associated Favorites, and post hearts survive edits.
- Delete a post or individual asset and clean up original/derived local files. Deletion is destructive; keep private backups.

## Post soundtracks

Upload/drop MP3, M4A, AAC, WAV, OGG, or FLAC (up to 100 MB/two hours). Preview audio, set trim start/end, volume, and loop; replace/remove it, and choose whether to mute the video's original audio. Saved audio is converted to AAC/M4A. One track belongs to the whole post, with playback controls and the shared mute toggle.

Audio follows the active post and stops as viewing changes. Compatible casting files combine media with the configured audio. Each queued TV item starts its own soundtrack segment; a continuous soundtrack across a post's items is local behavior, not a continuous track across separate receiver files. Upload only audio you have permission to publish. [Full soundtrack instructions](CAROUSELS-SOUNDTRACKS-THEMES.md).

## Five designed themes

| Theme | Look |
| --- | --- |
| Gold — default | Obsidian black, champagne lighting, warm editorial dates. |
| Graphite | Carbon/silver studio lighting with black backgrounds and thin gold borders. |
| Porcelain — light | Warm paper, ink type, bronze controls, fine gold hairlines. |
| Midnight | Deep indigo, moonlit blue accents, pale text. |
| Verdant | Forest-dark surfaces, sage accents, warm ivory type. |

The Theme button is on the wall and Favorites. Media colors are never filtered. The full viewer retains its cinema stage, even in Porcelain. Preferences persist per browser/hostname; new visitors start in Gold. Reduced-motion preferences are respected.

## Admin and visitor information

A username/password login issues a signed HTTP-only session cookie. Fresh setup creates unique credentials; change both username/password in Admin. Visitor-facing pages do not show editing tools without a valid session.

Change the gallery title, eyebrow text, and introduction in Admin. The Info panel contains the included installation, feature, editing, casting, and operation guides.

Statistics include visits, collection counts/hearts, approximate city/country, device, OS, and browser. Private/local IP addresses are hidden. Location is an IP-derived estimate, not GPS, and can be wrong or missing. A clear-all action resets visitor records; retention pruning and a visitor privacy page are included. Customize the notice for your deployment. Administrative statistics are not shipped with source releases.

## Import and preservation

Import your own extracted Instagram export locally. The standalone importer reads JSON from disk, preserves dates/carousel order, repairs common double-encoded captions, copies media into local uploads, and uses source IDs to avoid duplicate imports. It does not require publishing your export or giving Instagram credentials to this project.

Originals and generated previews/playback files live under `public/uploads/`; regenerable TV clips are cached privately in `work/cast-slides/`; Prisma/SQLite stores posts, ordering, settings, and account/visitor information. Streaming supports byte ranges and Cast media CORS. This is not automatic backup: protect your database, uploads, and environment settings separately.

## Install and maintain

Supported beginner path: Debian/Ubuntu Linux, Node.js 24+, pinned pnpm, FFmpeg/FFprobe, Git, Bash. Setup starts empty and builds production code. The launcher uses port 3000 on all interfaces and refuses an occupied port instead of opening a duplicate on 3001.

Start/stop/restart/status commands, Debian boot services, Cloudflare Quick/named tunnels, public HTTPS, private backups, server migration, and release upgrades are documented. The rebuild helper preserves the previous build, not a database/source rollback. v1.2.0 requires applying the optional soundtrack schema fields before building an older installation.

Source ZIP/tarball releases include checksums, schema, lockfile, and guides. They exclude credentials, personal media, populated databases, visitor data, private settings, backups, runtime binaries, and compiled output. The source is MIT licensed; owners maintain their own hosting and storage.
