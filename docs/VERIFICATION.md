# Verification notes

By Erik Adler. October 9, 2026.

## Verified locally

- Production build completes, including TypeScript checking, and the production launcher serves port 3000 on all network interfaces.
- Individual photo/video favorites can be added, reordered, removed, and restored after a browser reload.
- A timed photo advances to the next video; the video plays unmuted and completes the presentation. Pause/resume and native video controls remain available.
- A 390px mobile viewport has no horizontal overflow. Video playback uses native controls, with carousel and presentation navigation below the media.
- Carousel previous is disabled at the first item. Next and keyboard navigation advance through the carousel, then close it after the final item.
- After the swipe correction, horizontal pointer drags were checked in a 390px viewport: left advances and right goes back on both the wall and theater. Wall drags do not open the theater, and advancing past the theater's last item closes it. The shared gesture handler also accepts touch pointers; physical phone gestures still need a device check.
- The Cast control is a compact 44px overlay in the upper-right corner of wall and viewer media. It has no text pill covering the media.
- Wall arrow overlays were removed. A carousel photo selection stops its video; a pointer swipe back to the video starts it unmuted. Scrolling to another wall video transfers playback to that visible item, with one mounted player; returning resumes the original video. Opening the theater transfers playback from the wall to its video. Scrolling that video out of the theater viewport pauses and mutes it, and returning resumes it unmuted. These checks used a 390px browser viewport; actual phone autoplay remains subject to browser policy.
- Favorites presentation Pause stops and mutes its video; Play resumes it unmuted. The temporary favorite used for this check was removed afterwards.
- The favorites API preserves the requested order. Cast photo preparation produces a silent H.264 MP4 with the requested duration.
- Cast photo streaming supports HEAD, byte ranges, and CORS. Upload video streaming accepts CORS Range preflight requests.
- Admin Info displays the documentation included with the source repository.
- The Git repository excludes uploads, SQLite databases, environment secrets, local import manifests, visitor information, and verification screenshots.

## Requires real devices

Google Cast discovery and receiver playback require a supported Chrome browser, an HTTPS sender address, and a reachable physical receiver. These have not been verified with a TV. Physical touch swipes and device-specific mobile autoplay should also be checked on the intended phones. The viewer provides native video controls and an Enable sound fallback when a browser blocks unmuted autoplay.

After deployment, verify a single photo, a video with audio, a mixed favorites queue, repeat, pause/resume, navigation, and Stop casting. Confirm that only selected media appears on the TV, and that the TV queue continues when the local viewer closes.
