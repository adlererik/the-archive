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
