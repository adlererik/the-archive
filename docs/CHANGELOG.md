# Development notes

By Erik Adler.

## October 9, 2026

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
