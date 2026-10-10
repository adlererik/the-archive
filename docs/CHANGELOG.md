# Development notes

## Carousel curation, soundtracks, and gallery palettes

- Erik Adler: edit carousel sequence by drag/drop or accessible move controls; add/remove assets and extend single posts into carousels.
- Erik Adler: soundtrack uploads with preview, trim, volume, loop, original-video audio settings, and visibility-controlled playback.
- Erik Adler: prepare soundtrack-bearing images/videos for the standard Google Cast receiver.
- Erik Adler: Porcelain, Midnight, and Verdant join Gold (default) and Graphite; media colors remain unchanged.
- Erik Adler: insert a new memory near an existing timestamp; keep chronological ordering and detect competing edits.
- Erik Adler: add optional soundtrack database columns and safe file cleanup, and document migration/usage in Admin Info.

By Erik Adler.

## v1.1.0 — October 10, 2026

- By Erik Adler: publish the all-media thumbnail wall with year jumps, exact carousel-item viewing, scroll restoration, and quick Favorites collection building.
- Explain The Archive as a self-hosted replacement for Instagram's photo-sharing and memory-preservation workflow.
- Add complete feature documentation and a beginner installation/operation walkthrough, available in Admin Info.
- Generalize public Cloudflare, domain research, and operations examples for independent installations.
- Include all earlier mobile playback, swipe navigation, Gold/Graphite themes, admin, favorites, presentation, and media-only casting fixes.
- Publish source-only downloads with checksums, unique fresh-install credentials, and private-data exclusion checks.

## October 9, 2026

- By Erik Adler: fixed Google Cast media addressing behind Cloudflare HTTPS tunnels. The sender uses its current public HTTPS origin instead of the internal Next.js HTTP listener. Optional HTTPS media-host overrides remain supported, configuration is refreshed for each load, and failed receiver loads show a visible error without leaving local wall playback disabled.

- Established the source-only GitHub repository with private visibility and Erik Adler commit attribution.
- Added individual-media favorites, a saved list, manual ordering, and mixed photo/video presentations with image timing and repeat controls.
- Added carousel touch swipes and consistent keyboard/button navigation; advancing past the final item returns to the wall.
- Added media-only Google Cast controls and a receiver-side favorites queue. Photos use locally generated silent still-image clips; original files remain unchanged.
- Added CORS support and range streaming for TV media, cancellation of stale Cast loads, local audio handoff, and generated-clip cleanup after deletion.
- Added deployment, migration, boot startup, account, favorites, and Cast documentation that is available from the admin Info panel and included with the source repository.

Personal archive imports and their verification artifacts remain local. They are not included in Git.

## Carousel and Cast control update

- Corrected swipe direction consistently: left advances, right goes back.
- Added horizontal carousel swipes and mouse drags directly on wall previews, preserving vertical scrolling and preventing accidental theater opening after a swipe.
- Placed compact Cast icons over the upper-right corner of media in the wall, theater, and favorites viewer. Wall casting follows the selected carousel preview and silences local hover playback.

## Visible video playback update

- Removed the wall's left/right arrow overlays; swipes and thumbnail selection remain available.
- Replaced mouse-only preview playback and unconditional scroll stopping with one visibility-managed wall player, including touch-device viewing and carousel selection.
- Shared local video ownership prevents overlapping audio and stops stale playback requests after media changes.
- Theater and favorites videos pause when scrolled out of view or when their tab loses visibility, and resume when visible again. Unmuted autoplay is attempted first, with a browser-policy fallback for sound.

## Desktop viewing and discreet sound controls

- Removed the wall's “Click to view” label and sound text banners.
- Desktop cards remain accessible theater-opening buttons; touch and compact layouts render inline media with native video controls and no theater-opening target.
- Added a transparent speaker toggle with accessible mute/unmute labels. Sound starts enabled on a fresh load, and explicit mute persists through scrolling, swipes, and local media changes for the visit.
- Audio retry gestures respect explicit mute and exclude the speaker toggle itself, so its action does not immediately reverse.

## Wall audio recovery and continuous video playback

- By Erik Adler: reuse one wall video element across cards and carousel items to retain playback permission after a user gesture.
- Retry requested audio from click, touch-end, pointer-up, and keyboard interactions instead of relying on pointer-down.
- Prioritize a newly selected carousel video immediately, and ignore stale playback promises when the shared player changes sources.
- Keep the speaker in its default sound-on state when a browser blocks audio; a tiny gold dot indicates a tap is required. Explicit mute is still respected.

## Gold and graphite gallery themes

- By Erik Adler: added a Theme button on the wall and Favorites page, with the original Gold palette and a Graphite studio palette.
- Graphite replaces warm ambient lighting, surface tints, shadows, and text accents with neutral grays, while retaining black backgrounds and thin gold borders.
- Central palette variables cover the wall, viewer, favorites, casting controls, and management pages without applying filters to personal media.
- The palette is remembered per browser and applied before first paint. Theme menus support keyboard operation and stay within compact viewports.

## Public v1.0.0 release

- By Erik Adler: prepared the public MIT-licensed release with source-only ZIP/tarball downloads and checksums.
- Added a fresh-install setup command that creates an empty database and unique private credentials; removed shared authentication fallbacks and workstation-specific launcher paths.
- Pinned pnpm and its package-manager lockfile metadata for reproducible setup.
- Made Debian installers infer their checkout/account, support system Node 24, and preserve the existing production build during rebuilds.
- Added public setup, operations, migration, security, and release documentation to the repository and Admin Info.
- Recorded the project owner's confirmation that the Android Chrome/TV casting fix works. Private media and installation records remain outside Git and release assets.
- Fixed fresh SQLite initialization and launcher controls for long checkout paths discovered during the clean-install verification.

## October 10, 2026 — thumbnail wall

- By Erik Adler: added a main-wall toggle for a dense, responsive thumbnail grid, including every photo and video inside carousels.
- Retrieve the complete chronological metadata index in the background and virtualize nearby rows with lazy static previews.
- Open the exact selected carousel item on mobile and desktop; restore the wall position after closing or reaching the final carousel item.
- Preserve separate timeline/thumbnail scroll positions, add year jumps and keyboard navigation, and provide per-thumbnail Favorites stars for quick TV presentation collection building.
