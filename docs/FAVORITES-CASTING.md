# Favorites, presentations, Google Cast, and AirPlay

By Erik Adler.

## Favorites

Tap the star on a wall preview or in the media viewer to save that individual photo or video. For a carousel, choose the item first, then tap its star. Hearts still apply to whole posts; stars save individual media to your personal list.

Open Favorites from the archive header. Use the up/down controls to arrange the presentation order, or tap a saved item to inspect it. Favorites are stored in this browser's local storage. They are not shared between devices or accounts, and clearing browser data removes the list. Items deleted by the archive owner become unavailable; the list offers a cleanup button.

## Thumbnail wall for quick collection building

Use **Thumbnail wall** in the archive header to switch from the timeline to a dense grid of 56px-wide previews, matching the carousel thumbnails. The grid fills the gallery width, adapts its column count to the screen, and includes every image and video from every carousel in chronological order. It automatically retrieves older post metadata, with a loading indicator until the complete index is available. Only nearby rows are mounted and images load lazily; video thumbnails stay static while browsing.

Use **Jump to year** to find older memories. Tap a thumbnail to open that exact carousel item on desktop or mobile. Its original date, caption, video player, Favorites action, and Cast control remain available. Close it to return to the same thumbnail-wall scroll position. Swipe past a carousel's last item to return to that position as well. Tap the thumbnail's small star to save it without opening the viewer. The filled star identifies saved items.

Use **Timeline** to return to the default view. Each view retains its scroll position while the page remains open. Favorites built in thumbnail mode use the existing browser-local Favorites list and can be ordered, presented, and cast from Favorites. The thumbnail grid itself is not cast to the TV.

## Presentations

Choose a photo duration and optional Repeat presentation, then press Play presentation. Photos advance after they load and their selected display interval passes. Videos play with their audio and advance when they finish. Pause, resume, replay, previous, next, and Close presentation are available below the media. Mobile videos retain native playback controls; browser audio restrictions can require an Enable sound tap.

## Carousel navigation

Swipe left to advance to the next item and swipe right to return to the previous item. The wall carousel previews, theater, and favorites viewer use the same direction. Wall previews wrap at their ends and stay on the wall; vertical gestures continue scrolling the page. A swipe does not open the theater. Swiping forward after the final item closes the viewer and returns to its card. Previous at the first item does not wrap. Keyboard arrow keys and carousel buttons use the same previous/next behavior. The Newer/Older controls still switch between posts.

Wall previews use swipes, the item counter, and thumbnail selection, with no arrow overlays. Tap the counter to advance, wrapping to the first item after the last. The counter and media icons share small translucent backgrounds at 37.5% opacity and fade after three seconds of inactivity. Pointer movement, touch, and keyboard focus reveal them again; open sharing/casting menus and keyboard-focused controls keep them visible. Only cards in the viewport run inactivity timers. The most visible wall video starts automatically, with mouse hover taking priority on desktop. Only one local video plays at a time. Swiping to a different item immediately pauses and mutes the old video, then starts the selected video if visible. Scrolling it out of view, switching tabs, opening another viewer, or casting pauses local playback; returning to view resumes it. Unmuted playback is attempted first. If the browser requires user interaction, a muted preview remains available; tap the wall's speaker icon to enable sound.

The wall has no “Click to view” label. Only desktop layouts with a fine pointer and hover support open the theater from a card. Touch devices and compact layouts keep photos and videos inline, with native video controls; swiping, favorites, and Cast remain available. A small transparent speaker icon toggles local sound, replacing the sound text banners. Sound defaults on for a fresh page load, while an explicit mute remains selected through scrolling, carousel changes, and local media viewing during that visit.

The wall reuses one video element across cards and carousel selections, helping retain browser playback permission after a tap. Selecting a carousel item takes playback priority immediately; scrolling or desktop hover then chooses the next active video. Click, touch-end, pointer-up, and keyboard interactions retry a browser-blocked sound request. The speaker remains in its sound-on state when sound is requested, with a small gold dot if the browser still requires a tap. Tap that speaker to allow audio. Only an explicit mute switches the preference off; browser rejection does not change the preference.

Mobile browsers can still require an initial tap before audible playback. A vertical scroll or mouse hover alone cannot guarantee audio permission, and device volume remains under the viewer's control. See [WebKit's video policy](https://webkit.org/blog/6784/new-video-policies-for-ios/) and [Chrome's autoplay policy](https://developer.chrome.com/blog/autoplay). Muted preview is used only when the browser rejects sound, so the video remains viewable.

## AirPlay in Safari

In Safari on iPhone, iPad, or Mac, tap the existing Cast icon on the selected photo/video to open Safari’s native AirPlay picker. Select an AirPlay-compatible TV or Apple TV on the same network. No second icon is added. The application calls `webkitShowPlaybackTargetPicker()` directly during that button click, before any asynchronous work, and explicitly enables AirPlay on its native video player. It detects the API rather than guessing from a device name.

For a compatible video already displayed, the button calls AirPlay on that same native player, preserving its current playback position. It starts unmuted playback before opening the picker, inside the original tap. A separate native transport is used for photos, soundtrack composites, or a Favorites launch without a displayed video. The selected player is retained if wall recycling or closing a viewer removes its original container; local visibility guards cannot pause or mute it during receiver selection or wireless playback. Only media is sent; the website and admin controls are not mirrored. Images and soundtrack-bearing media use the same server-generated MP4 assets as Google Cast. FFmpeg is needed for those assets. Plain videos use their compatible playback file. Local gallery playback pauses once Safari reports a wireless connection. Existing Play/Pause on TV and Stop casting controls apply to AirPlay too. Stop casting stops the media; Safari owns the system’s selected output route.

Carousel selections update the AirPlay media. Favorites presentations advance through the native video player’s ended events, with the configured photo interval and repeat option. Unlike a Google Cast receiver queue, these advances depend on the sender page remaining alive; Safari may suspend it in the background. The application cannot promise an independent AirPlay slideshow after the phone locks.

Use the archive’s HTTPS address, keep the TV able to reach its media URLs, and check the TV’s AirPlay permissions. Safari controls device discovery; this site cannot choose a receiver silently or grant access to the TV. A supported Safari browser keeps the button enabled even before a nearby receiver is discovered. A canceled or unsuccessful selection returns the player to local control after the selection timeout.

### Picker says “Not Playing” or shows only iPhone Speaker

The picker needs a native player with a playable source and active playback. The current implementation prefers the displayed video and starts it before invoking the picker; it does not pause the transport on `loadeddata` while waiting for a receiver.

A TV must also expose an AirPlay receiver. Chromecast, Google TV, Android TV, and Ambilight branding alone do not establish AirPlay support. If only iPhone Speaker appears, verify the exact TV model, AirPlay settings, and shared Wi-Fi network. Safari cannot send native AirPlay to a Google Cast-only receiver. Changing to Chrome on an iPhone does not enable Google’s Web Sender SDK.

An optional receiver app such as [AirScreen on Google Play](https://play.google.com/store/apps/details?id=com.ionitech.airscreen) can add AirPlay to some Android TVs. Install and open it on the TV, then choose its receiver name from the existing Cast button’s AirPlay picker. It is third-party software, may include ads/in-app purchases, and does not guarantee support for every TV or video. Alternatively, use an AirPlay-compatible receiver such as Apple TV. These receiver options do not require page/screen mirroring; the site’s button continues to request media playback.

See [Apple’s receiver and network requirements](https://support.apple.com/en-ie/102661) and [Google’s supported Web Sender platforms](https://developers.google.com/cast/docs/web_sender).

Official references: [Apple’s custom AirPlay button](https://developer.apple.com/documentation/webkitjs/adding_an_airplay_button_to_your_safari_media_controls) and [enabling AirPlay for HTML video](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/AirPlayGuide/OptingInorOutofAirPlay/OptingInorOutofAirPlay.html).

## Google Cast

Open a photo or video and use its Cast icon. The Cast icon is overlaid in the upper-right corner of photos and videos, including wall previews. It casts the currently selected item without opening the theater. The same icon is used for Google Cast in supported Chrome and native AirPlay in Safari. Gallery overlays form a small top-right column with Cast first, then Send, Favorite, and Volume. The counter has matching styling, and overlays fade after three seconds of inactivity. A filled favorite indicates a saved item, and casting status is shown in the cast controls. A browser with neither API hides the Cast icon; a missing receiver does not disable a supported browser’s picker. Choose your Chromecast or Google Cast-enabled TV. The receiver loads the media from your archive. This application never requests tab, screen, or desktop mirroring, and never casts its page, admin controls, favorites grid, or captions.

While a single item is cast, changing the selected carousel item in the same card or viewer updates the TV. Tap the active overlay for the Stop casting option, or use the persistent casting controls. Local video playback pauses to avoid duplicate audio. Pause/Play on TV and Stop casting control the receiver.

Use Cast presentation from Favorites or inside the presentation viewer to send the ordered favorites queue. The TV advances through complete videos and timed photo slides, with the selected repeat setting. The queue runs on the receiver; it does not depend on phone slideshow timers. Closing the local viewer does not stop the TV queue; use Stop casting to end it.

The standard Google receiver supports the mixed queue without a custom receiver registration. Photos are prepared locally as silent, still-image MP4 slides with black letterboxing and their original aspect ratio. Their original files are preserved. Generated clips are cached in `work/cast-slides/`, excluded from Git, and removed when their source post is deleted. A single photo repeats on the receiver until replaced or casting is stopped. Video playback uses H.264/AAC MP4 copies.

### Browser, HTTPS, and network setup

- Use a Google Cast-supported Chrome browser. Chrome on iOS does not support the Web Sender SDK. Safari uses native AirPlay through the same icon. Embedded browsers may expose neither API.
- Serve the archive over HTTPS for phones and normal network access. An `http://192.168...` sender page is insecure and cannot use the required Cast presentation API. The computer's localhost origin is a development exception, but the TV still cannot use localhost to download media.
- Keep the sender and TV on the same network, with Cast discovery allowed by the router. Guest Wi-Fi and network isolation can prevent discovery.
- The TV must be able to download the media URL. By default, casting uses the HTTPS origin currently open in the sender browser. This preserves the public tunnel hostname and HTTPS scheme instead of sending an internal HTTP listener address. An optional `CAST_MEDIA_ORIGIN=https://your-archive-domain.example` in `.env.local` (or `NEXT_PUBLIC_CAST_MEDIA_ORIGIN`) can override it for a separate HTTPS media host; leave these unset for rotating Quick Tunnel URLs. Localhost and HTTP media origins are rejected before loading the receiver. A successful device connection alone does not mean the media loaded; receiver load errors appear visibly, and an empty or failed session does not suppress local wall playback.
- The reverse proxy must preserve Range, Content-Range, Content-Length, Content-Type, and CORS headers. The application supplies CORS headers for media and generated slides. Keep authentication on admin routes; the TV does not receive an admin session cookie.
- Google Cast's sender SDK is loaded from Google's official server and communicates with the selected device. Favorites are sent to the device only when casting is requested. Visitor records and login credentials are never part of a Cast request.

Physical TV compatibility must be checked using your Chrome browser and actual receiver. A successful application build or a viewport preview cannot verify device discovery, receiver access to your server, or TV playback.

Official references: [Web Sender setup](https://developers.google.com/cast/docs/web_sender), [sender integration](https://developers.google.com/cast/docs/web_sender/integrate), [supported media](https://developers.google.com/cast/docs/media), and [queue data](https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media.QueueData).

## Send a memory or presentation

See [Sharing step by step](SHARING.md) for creating, sending, playing, and preserving these links.

Tap the paper-plane icon on a photo/video for its direct link. In Favorites, arrange your list, choose photo duration and Repeat, then use **Send to** for one compact link to the entire selection. The menu supports Copy link, Email, Message, and your device’s native share sheet where available. The recipient needs only the URL: no favorites storage or admin account is required. Later changes to your local favorites do not alter an existing link; source media edits appear in its viewer, and deleted assets are skipped. Thumbnail previews depend on the receiving app.

Presentations begin automatically, play each video to completion, advance through images at the chosen interval, and repeat by default. They request sound on by default. If a browser blocks autoplay with sound, the viewer continues muted and offers Tap for sound; strict settings may also require a Play tap. Videos expose native scrubber/play/pause/volume/fullscreen controls where supported, alongside speed selection. Presentations have a position slider, previous/next, and pause/replay controls. Pictures can be viewed fullscreen where supported. On the gallery and Favorites pages, casting controls appear only after Google Cast or AirPlay support is detected. The compact shared viewer provides native media controls rather than the gallery's dedicated Cast presentation button.
