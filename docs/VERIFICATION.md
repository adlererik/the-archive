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

The source and private archive data were transferred to a Debian 13 server, with a private Node 24.19.0 runtime and lockfile-based dependency installation. Its production build completed with TypeScript checking. The media package checksum matched, SQLite integrity was `ok`, and all source posts, carousel media, and referenced files were present. The server served the wall, posts API, and an existing video over port 3000. The final data snapshot was copied after stopping the workstation server. After terminal authentication, the root setup completed. FFmpeg, FFprobe, and Git are installed. The `the-archive@youruser` systemd service is enabled and active, runs as the application owner, listens on `0.0.0.0:3000`, and restarts after failures. The temporary launcher stopped, and the workstation launcher remains stopped. Home, posts API, and admin login returned HTTP 200; video byte-range streaming returned HTTP 206. A source-only Git checkout was restored on the server without workstation credentials or private media in its tracked files. Startup configuration was verified without rebooting the machine.

## Cloudflare preparation

The official cloudflared 2026.10.0 Linux amd64 binary was downloaded and verified against its release SHA-256 digest. A temporary systemd user connector successfully served the gallery and CMS login over verified HTTPS, both returning HTTP 200. The system-wide boot service installer, named-tunnel switch script, registry research, and purchasing guide are committed as source. Terminal installation has completed: `the-archive-tunnel` is enabled and active, runs as the application owner, and uses `Restart=always`. The temporary user connector is stopped. Secure session cookies and local proxy trust are enabled. A Quick Tunnel URL is temporary and is not recorded in Git. No domain was purchased and no account-owned named tunnel has been enrolled yet.

## Cast fix for a tunnel origin

The running Debian server's Cast config returned `http://0.0.0.0:3000`, which is not an address a receiver can use to fetch media. The fix makes the sender use its current public HTTPS origin by default and preserves optional explicit media-host configuration. A video and generated photo slide both returned HTTP 206, MP4 content type, and wildcard CORS headers from the existing media endpoints. The updated local production build completed with TypeScript checking. The fixed commit was deployed to Debian and its production build restarted successfully. Both the LAN and public HTTPS Cast configuration now return `mediaOrigin: null`, instructing the sender to use the HTTPS origin open in its browser. The public gallery and login return HTTP 200. Both a photo slide and a video return HTTP 206 through the tunnel with MP4 MIME type and wildcard CORS; neither needs an admin cookie. The database remains healthy with matching post and media counts. The project owner subsequently confirmed that the fix works on the physical Android Chrome/TV setup. This is user-reported receiver confirmation in addition to the server checks.

## Requires real devices

Google Cast discovery and receiver playback require a supported Chrome browser, an HTTPS sender address, and a reachable physical receiver. The project owner confirmed receiver playback after the HTTPS-origin fix; full mixed favorites queues and every receiver model have not been physically checked. Physical touch swipes and device-specific mobile autoplay should also be checked on the intended phones. The wall provides native video controls and a speaker toggle when a browser blocks unmuted autoplay; the theater also provides a sound fallback.

After deployment, verify a single photo, a video with audio, a mixed favorites queue, repeat, pause/resume, navigation, and Stop casting. Confirm that only selected media appears on the TV, and that the TV queue continues when the local viewer closes.

## Public release preparation

A source-only snapshot was extracted separately from the private gallery. The documented setup installed locked dependencies with pnpm 12.10.1, generated unique private environment files, initialized an empty SQLite database, and completed a Next.js production build with TypeScript checking. A second build with explicit tracing-root configuration also completed. Startup was checked on an isolated loopback port 3100: the gallery, login, favorites, and Cast config returned HTTP 200. The generated account successfully authenticated with an HTTP-only session and opened Admin. The installation contained zero posts/media and one account; `.env.local` had permission 600. The verification launcher was stopped afterwards. Long checkout paths now use a protected short control-socket path rather than failing the Unix socket path limit.

All reachable Git history and staged source were scanned for installation credentials, known token formats, private keys, private file paths, and media/database files. No matches were found. Release archives are generated exclusively with `git archive`, audited again, and accompanied by SHA-256 checksums. Fresh Debian root installation of the generalized scripts has not been repeated on a second machine; shell syntax was checked, and the original deployed service remains the separate working installation described above.

## Thumbnail wall — October 10, 2026

The thumbnail-wall implementation compiles in the production build, including TypeScript checking. It reuses the chronological cursor API to retrieve every post's carousel assets, mounts a bounded range of 64px thumbnail rows, and uses static/lazy previews. The viewer receives the selected media index; its close handler restores the captured document scroll position. Timeline and thumbnail mode keep separate in-page positions. Direct Favorites stars reuse the existing browser-local media IDs and presentation/Cast workflow. No database schema change is required. Real-device interaction checks for the new grid have not been recorded yet.

The feature's staged Debian production build also completed with TypeScript checking. After administrator activation, the boot service is enabled and active on port 3000. The LAN gallery and public HTTPS page return HTTP 200 with the thumbnail toggle, and the deployed browser bundle contains the year selector and all-media index. Seven chronological API pages returned every source post and distinct media item, matching the database; SQLite integrity remains `ok`. Cast configuration continues to use the sender's public origin. The previous production build is preserved for rollback. These are build/deployment checks; physical phone interactions for the new grid still require viewer confirmation.

## Public release v1.1.0 — October 10, 2026

A fresh copy of the staged public source was installed with `./archive setup`, without copying an existing environment, database, or uploads. Dependency installation, Prisma schema creation, and the Next.js 15.5.27 production build completed successfully, including TypeScript checks.

The fresh production server was started on an isolated loopback port. The gallery, login page, favorites page, posts API, and Cast configuration API returned HTTP 200. The posts API was empty; SQLite contained zero posts and zero media items. The generated environment file had mode 0600. Login with the newly generated credentials succeeded, issued an HTTP-only session cookie, and opened Admin with the beginner and feature guides available.

Release privacy checks cover tracked source, reachable Git history, commit messages, and the downloadable source archives: prohibited private-file paths, common credential formats, and known local installation credentials. Source packages are generated with `git archive`; local environments, databases, uploads, authentication files, and deployment work directories are excluded. SHA-256 checksums accompany the downloads.

Physical phone/TV casting was not repeated for this documentation release. Earlier user-confirmed casting fixes remain included; see the device requirements and limitations in the feature guide.

## Carousel editing, soundtracks, and themes — October 10, 2026

The production build and TypeScript checks completed successfully on the workstation and in a separate Debian staging checkout. The live database was backed up during activation; optional soundtrack columns were added without a destructive reset. The prepared build was activated, the application service was active and enabled, and its existing tunnel remained active. The local server on port 3000 and the public HTTPS posts API returned the new soundtrack/edit-version metadata with the existing collection present.

Browser review showed the extended editor's sequence, add/remove/move controls, soundtrack drop area, and editable timeline date. Porcelain, Midnight, and Verdant were visually reviewed; Gold was restored in the preview. No existing post was changed for the preview. The source/history privacy audit found no prohibited private-file paths or credential matches. These checks do not establish physical-TV playback of the new soundtrack composites or audible autoplay permission on every phone.

## Shared Google Cast / AirPlay button — October 10, 2026

The production build completed successfully with TypeScript checks, and the workstation server starts on port 3000. The gallery, Favorites, and Cast configuration returned HTTP 200. Source review confirms that the existing Cast icon markup, CSS classes, sizes, and overlay positioning remain unchanged. Google’s device request, default receiver, media URL construction, and receiver queue code are preserved. Safari’s native picker is called synchronously from the existing button click, using API detection and a native media element explicitly enabled for AirPlay. Receiver discovery does not disable a supported browser’s button. The transport is separate from recycled wall previews and shares the existing remote-control state.

No physical Safari/Apple TV session was available for this change. Compilation and endpoint health do not establish native-picker discovery, TV playback, or Safari background slideshow reliability. Confirm those with an actual Apple device and compatible AirPlay receiver. AirPlay presentation advancement depends on the sender page remaining alive, unlike Google’s receiver queue.

The separate Debian production build also completed successfully. After administrator activation, the live source commit and build ID matched the prepared update, and the application and tunnel services were active and enabled at boot. The server’s gallery, Favorites, login, and Cast configuration returned HTTP 200 on port 3000. Public HTTPS requests succeeded for the same routes, and the public page’s loaded JavaScript bundle contains the native AirPlay picker call. The previous build/database backup is retained for rollback. This confirms deployment and delivery of the feature; it does not establish a physical AirPlay receiver session.

## AirPlay “Not Playing” correction — October 10, 2026

After the first AirPlay deployment, an iPhone viewer reported “Not Playing” and only the phone’s speaker in the picker. Source inspection identified a premature `loadeddata` pause in the separate transport, plus a picker invocation preceding playback. The correction prefers the currently displayed native video, preserves its position, starts it unmuted in the original tap before opening the picker, and reserves the separate transport for photos/composites or presentations without a displayed video. Native ownership protects the player from local visibility pauses, muting, and wall reuse; its element is retained if removed from a viewer. Stop, failed playback, and unsuccessful receiver selection release ownership. Short source-transition wireless-state changes are debounced. Cast icon markup/classes and Google receiver loading/queue code remain unchanged.

The updated production build completed with TypeScript checks. The workstation server starts on port 3000; gallery, Favorites, and Cast configuration return HTTP 200. No physical AirPlay receiver was available to confirm this correction. The TV model reported by the viewer is an Android/Chromecast model whose Philips documentation does not list native AirPlay; an AirPlay receiver is a separate prerequisite. Documentation now covers receiver compatibility and optional third-party receiver apps without promising support for every TV. The original physical Android/Google Cast confirmation remains earlier evidence, not a new device test for this change.

Before activating this correction, the project owner confirmed that the original AirPlay implementation worked from an iPhone with a different, AirPlay-compatible TV. That is user-reported physical confirmation of the original implementation and receiver compatibility diagnosis, not a device test of the revised handoff.

The corrective update’s separate Debian production build completed successfully. After administrator activation, the live source commit and build ID matched the prepared correction. The site and tunnel services were active and enabled at boot. Gallery, Favorites, login, and Cast configuration returned HTTP 200 on port 3000; public HTTPS requests succeeded, and the browser bundle served by the public site contains the displayed-video handoff. The earlier production build/database backup remains available through the deployment’s rollback mechanism. Physical video/audio playback with this revised handoff still requires owner confirmation.

## Public v1.2.0 source release — October 10, 2026

A separate installation extracted only tracked source and ran `./archive setup` with locked dependencies. The production compilation, TypeScript checks, static generation, and build tracing completed successfully. Its production launcher started on an isolated verification port so the existing gallery remained available.

Before browsing, the new database had zero posts, media items, and visits, and uploads contained no files beyond `.gitkeep`. Setup generated credentials distinct from the live installation and environment files with mode 0600. Gallery, Favorites, privacy, login, posts, and Cast configuration returned HTTP 200. The posts and Favorites responses were empty. Initial admin login succeeded with a signed HTTP-only SameSite cookie, and authenticated Admin rendered the included feature guide. No private credential value is recorded here.

All local documentation links resolve. Git history, the index, and the source-only ZIP/tarball are checked for excluded private paths, common credential formats, and known private installation credential matches. Release archives are generated from Git source, not the working directory, and include SHA-256 checksums. Erik Adler's requested attribution and public repository address are intentional; installation identities, private credentials, original media, databases, visitor records, and runtime artifacts are excluded.

These checks establish clean installation and source-package health. They do not add a new physical-phone/TV test; the earlier receiver confirmations and latest AirPlay handoff limitations above still apply.

## Public v1.3.0 source release — October 10, 2026

A separate clean directory was extracted from the audited Git source candidate and ran `./archive setup` with Node.js 24 and the locked dependencies. Production compilation, TypeScript validation, static generation, and build tracing completed successfully. The production server then ran on an isolated verification port; the existing gallery was left running.

The clean setup explicitly generated `ADMIN_AUTH_MODE="password"`, a unique password/session secret distinct from the private installation, and environment files with permissions 0600. No Cloudflare configuration or saved identity mode was present. SQLite contained zero posts, media items, and visits; uploads contained only `.gitkeep`. The same counts remained after the local checks.

Gallery, Favorites, privacy, password login, posts, and Cast configuration endpoints responded successfully. Anonymous media/settings administration redirected to password login. Login using the generated credentials succeeded with a signed HTTP-only SameSite cookie. Authenticated settings included the new sharing and visitor guides. Logout returned to the relative gallery root, cleared the cookie, and protected settings required login again. No credential value is recorded here.

All three pre-existing README image embeds were preserved exactly. Local documentation links were checked. Reachable Git history, staged source, and the final source archives were audited for private paths, common credential patterns, and known private installation secret matches. Source archives are produced using `git archive`, with SHA-256 checksums; no workspace data, populated database, uploads, private runtime settings, credential files, or compiled output belongs in them.

These checks establish clean installation, default password authentication, handbook delivery, and source packaging. They do not claim a new physical phone/TV test or audible autoplay on every device. Earlier casting confirmations remain historical evidence; receiver/browser requirements and AirPlay sender-lifecycle limits still apply. Earlier sections describe the interface of the release tested there; [Features](FEATURES.md) documents the current release.
