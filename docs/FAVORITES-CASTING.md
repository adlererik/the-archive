# Favorites, presentations, and Google Cast

By Erik Adler.

## Favorites

Tap the star on a wall preview or in the media viewer to save that individual photo or video. For a carousel, choose the item first, then tap its star. Hearts still apply to whole posts; stars save individual media to your personal list.

Open Favorites from the archive header. Use the up/down controls to arrange the presentation order, or tap a saved item to inspect it. Favorites are stored in this browser's local storage. They are not shared between devices or accounts, and clearing browser data removes the list. Items deleted by the archive owner become unavailable; the list offers a cleanup button.

## Presentations

Choose a photo duration and optional Repeat presentation, then press Play presentation. Photos advance after they load and their selected display interval passes. Videos play with their audio and advance when they finish. Pause, resume, replay, previous, next, and Close presentation are available below the media. Mobile videos retain native playback controls; browser audio restrictions can require an Enable sound tap.

## Carousel navigation

Swipe left to advance to the next item and swipe right to return to the previous item. The wall carousel previews, theater, and favorites viewer use the same direction. Wall previews wrap at their ends and stay on the wall; vertical gestures continue scrolling the page. A swipe does not open the theater. Swiping forward after the final item closes the viewer and returns to its card. Previous at the first item does not wrap. Keyboard arrow keys and carousel buttons use the same previous/next behavior. The Newer/Older controls still switch between posts.

Wall previews use swipes and thumbnail selection, with no arrow overlays. The most visible wall video starts automatically, with mouse hover taking priority on desktop. Only one local video plays at a time. Swiping to a different item immediately pauses and mutes the old video, then starts the selected video if visible. Scrolling it out of view, switching tabs, opening another viewer, or casting pauses local playback; returning to view resumes it. Unmuted playback is attempted first. If the browser requires user interaction, a muted preview and Enable sound button remain available.

## Google Cast

Open a photo or video and use its Cast icon. The Cast icon is overlaid in the upper-right corner of photos and videos, including wall previews. It casts the currently selected item without opening the theater. A white icon indicates availability, gold indicates an active cast; otherwise tapping the dim icon explains what is missing. Choose your Chromecast or Google Cast-enabled TV. The receiver loads the media from your archive. This application never requests tab, screen, or desktop mirroring, and never casts its page, admin controls, favorites grid, or captions.

While a single item is cast, changing the selected carousel item in the same card or viewer updates the TV. Tap the active overlay for the Stop casting option, or use the persistent casting controls. Local video playback pauses to avoid duplicate audio. Pause/Play on TV and Stop casting control the receiver.

Use Cast presentation from Favorites or inside the presentation viewer to send the ordered favorites queue. The TV advances through complete videos and timed photo slides, with the selected repeat setting. The queue runs on the receiver; it does not depend on phone slideshow timers. Closing the local viewer does not stop the TV queue; use Stop casting to end it.

The standard Google receiver supports the mixed queue without a custom receiver registration. Photos are prepared locally as silent, still-image MP4 slides with black letterboxing and their original aspect ratio. Their original files are preserved. Generated clips are cached in `work/cast-slides/`, excluded from Git, and removed when their source post is deleted. A single photo repeats on the receiver until replaced or casting is stopped. Video playback uses H.264/AAC MP4 copies.

### Browser, HTTPS, and network setup

- Use a Google Cast-supported Chrome browser. Chrome on iOS does not support the Web Sender SDK. Safari and the embedded preview browser may not expose Google Cast.
- Serve the archive over HTTPS for phones and normal network access. An `http://192.168...` sender page is insecure and cannot use the required Cast presentation API. The computer's localhost origin is a development exception, but the TV still cannot use localhost to download media.
- Keep the sender and TV on the same network, with Cast discovery allowed by the router. Guest Wi-Fi and network isolation can prevent discovery.
- The TV must be able to download the media URL. Set `CAST_MEDIA_ORIGIN=https://your-archive-domain.example` in `.env.local` when deploying. `NEXT_PUBLIC_CAST_MEDIA_ORIGIN` is also supported. The local config endpoint translates a localhost address to a detected LAN address when possible.
- The reverse proxy must preserve Range, Content-Range, Content-Length, Content-Type, and CORS headers. The application supplies CORS headers for media and generated slides. Keep authentication on admin routes; the TV does not receive an admin session cookie.
- Google Cast's sender SDK is loaded from Google's official server and communicates with the selected device. Favorites are sent to the device only when casting is requested. Visitor records and login credentials are never part of a Cast request.

Physical TV compatibility must be checked using your Chrome browser and actual receiver. A successful application build or a viewport preview cannot verify device discovery, receiver access to your server, or TV playback.

Official references: [Web Sender setup](https://developers.google.com/cast/docs/web_sender), [sender integration](https://developers.google.com/cast/docs/web_sender/integrate), [supported media](https://developers.google.com/cast/docs/media), and [queue data](https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media.QueueData).
