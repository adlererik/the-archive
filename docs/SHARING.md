# Share a photo, video, or complete presentation

By Erik Adler · v1.3.0.

## Before sending a link

Your gallery must be running at an address the recipient can reach. For friends outside your home, use public HTTPS and preferably a stable domain. `localhost` points to the recipient's own device; a private LAN address works only on your local network. A temporary Cloudflare Quick Tunnel address can change after restart.

## Send one memory

1. Find the photo/video in the timeline. For a carousel, swipe, select a thumbnail, or tap the counter until the desired item is selected.
2. Move the pointer or tap the media to reveal its icons if they have faded.
3. Tap the paper-plane **Send to** icon in the top-right column.
4. Choose **Copy link**, **Email**, **Message**, or **Share with your apps** where supported.
5. Choose the recipient and send in your own app. The CMS does not send email or text messages itself.

The URL contains a compact `/s/` token rather than a long list of media IDs. A link such as `https://your-domain.example/s/AbCdEf0123456789` opens that selected item without an account.

## Send a compilation of photos and videos

1. Tap the star on each desired photo/video. A star saves an individual asset; a heart likes the whole post.
2. Open **Favorites** using the film-reel icon and its selected-item count.
3. Arrange the order using the move controls; remove anything you do not want included.
4. Choose the photo display duration and Repeat setting. Videos play to completion.
5. Use the paper-plane **Send to** control on Favorites to prepare one link to this selection.
6. Copy the link or open your message/email/native share app and send it.

The recipient opens one URL. The presentation automatically advances through the ordered photos and videos and repeats if selected. It does not need the recipient's Favorites list or an admin account. A saved link keeps its selection/order when you later change your browser Favorites. The current media/caption is loaded when viewed; deleted items are skipped, and a selection with no remaining media is unavailable.

## What the recipient can do

- Play, pause, replay, move to the previous/next memory, and use the presentation position slider.
- Scrub videos using their native seek bar, and adjust speed or use fullscreen where the browser supports it.
- Enable/mute sound. Links request sound by default, but browsers can block audible autoplay. The viewer then offers **Tap for sound**; strict settings may require Play first.

The gallery and Favorites page provide the dedicated Google Cast/AirPlay presentation controls; see [casting requirements](FAVORITES-CASTING.md).

Open Graph/Twitter metadata includes the first item's thumbnail when available. Messaging services decide whether to fetch/display a preview and can cache older previews. Video autoplay, native sharing apps, fullscreen, and receiver discovery depend on the device/browser.

## Preserve links and understand access

Selections are stored in private `.runtime/shared-links/` files on your server. Back up that directory, the database, and `public/uploads/` together. Keep the same public hostname or preserve its route when moving servers. Link creation requires no paid shortener or external sharing API.

Shared URLs point to public gallery media. They are convenient sharing addresses, not private albums or expiring access grants. Anyone with a link can view and forward it. There is no automatic shared-link expiry or management screen for revoking individual links in this release. Clearing your browser's Favorites does not delete previously created selections. Do not publish the private runtime files to GitHub.
