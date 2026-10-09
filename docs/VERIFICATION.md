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
- The wall has no “Click to view” or “Sound on” label. In a 390px viewport, wall media has no theater-opening button, tapping a photo stays inline, and swiping to a video starts playback with native controls. The transparent speaker toggle mutes without pausing, keeps that choice through carousel changes and scrolling, and restores sound when toggled again. In the normal 499px viewport with a fine pointer and hover, a card opens the theater through keyboard activation; advancing to a video starts it unmuted.
- After adding the reusable wall player and interaction recovery, a 390px viewport swipe started the selected video unmuted with native controls. Selecting a photo removed the mounted player; returning to the video resumed sound. Scrolling to a different video changed its source with one player mounted and sound enabled; scrolling to photos removed it, and returning resumed the original video unmuted. Desktop pointer entry selected the carousel's video, the theater played it with sound, and closing the theater resumed unmuted wall playback without native desktop controls. These checks do not verify a physical phone's initial audio permission.
- Favorites presentation Pause stops and mutes its video; Play resumes it unmuted. The temporary favorite used for this check was removed afterwards.
- The favorites API preserves the requested order. Cast photo preparation produces a silent H.264 MP4 with the requested duration.
- Cast photo streaming supports HEAD, byte ranges, and CORS. Upload video streaming accepts CORS Range preflight requests.
- Admin Info displays the documentation included with the source repository.
- Gold and Graphite can be selected from the Theme button. Graphite survives a reload and navigation to Favorites; returning to Gold restores the original accent and warm glow values. A 390px viewport keeps the theme menu inside the screen without horizontal overflow. A 1280px viewport displays four gallery columns. Computed styles confirm a 1px gold card border, the unchanged `#070709` body background, and no image filter in Graphite. Escape closes the picker and returns focus to its button.
- The Git repository excludes uploads, SQLite databases, environment secrets, local import manifests, visitor information, and verification screenshots.

## Debian migration checks

The source and private archive data were transferred to a Debian 13 server, with a private Node 24.19.0 runtime and lockfile-based dependency installation. Its production build completed with TypeScript checking. The media package checksum matched, SQLite integrity was `ok`, and all 219 posts, 773 media items, and 1,736 referenced files were present. The server served the wall, posts API, and an existing video over port 3000. The final data snapshot was copied after stopping the workstation server. After terminal authentication, the root setup completed. Erik is a member of the sudo group; FFmpeg, FFprobe, and Git are installed. The `the-archive@erik` systemd service is enabled and active, runs as `erik`, listens on `0.0.0.0:3000`, and restarts after failures. The temporary launcher stopped, and the workstation launcher remains stopped. Home, posts API, and admin login returned HTTP 200; video byte-range streaming returned HTTP 206. A source-only Git checkout was restored on the server without workstation credentials or private media in its tracked files. Startup configuration was verified without rebooting the machine.

## Requires real devices

Google Cast discovery and receiver playback require a supported Chrome browser, an HTTPS sender address, and a reachable physical receiver. These have not been verified with a TV. Physical touch swipes and device-specific mobile autoplay should also be checked on the intended phones. The wall provides native video controls and a speaker toggle when a browser blocks unmuted autoplay; the theater also provides a sound fallback.

After deployment, verify a single photo, a video with audio, a mixed favorites queue, repeat, pause/resume, navigation, and Stop casting. Confirm that only selected media appears on the TV, and that the TV queue continues when the local viewer closes.
