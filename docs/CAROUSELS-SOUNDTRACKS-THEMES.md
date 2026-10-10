# Curating media, soundtracks, and gallery themes

By Erik Adler.

## Edit an existing memory

1. Sign in as an administrator, then return to the public wall.
2. Press **Edit** on the memory. The sequence displays every existing photo/video.
3. Drag items into the desired order. On a phone or with a keyboard, use each item's move-earlier/move-later buttons.
4. Press **Add media**, or drop more image/video files into the sequence. Add to a single-photo/video post to turn it into a carousel.
5. Remove individual items with the trash icon. **Undo** restores the most recently removed item in the draft. Keep at least one media item to save.
6. Edit the caption or the date/time if needed.
7. Press **Save changes**. The order, additions, removals, soundtrack, and text become visible together. Closing without saving discards the draft.

Existing assets keep their media IDs when reordered. Favorites remain attached to those assets. Removing an asset also removes its original, thumbnail, playback copy, and prepared casting files. Deleted favorites are reported as unavailable. Post hearts survive a carousel edit. If another administrator saves first, reopen the editor rather than overwriting their changes.

## Insert anywhere in the timeline

Press **Insert here** beneath an existing memory to open a new upload with a suggested timestamp just before that memory. Adjust the date/time to the exact instant you want. The square-plus → **A new chapter** uploader also accepts any year or date, for a single post or a carousel. New posts and edited dates are sorted newest first automatically; reload the wall after an upload.

## Give a post a soundtrack

1. Open the existing post's editor, or start a new upload.
2. In **Soundtrack**, drag an audio file onto the drop area or press it to browse.
3. Preview using the audio player's Play/Pause, seek, and volume controls.
4. Set **Trim start** and **Trim end** in seconds, choose the soundtrack volume, and enable/disable looping.
5. **Mute original video audio** replaces the video's own sound while the soundtrack plays. Disable it to hear both.
6. Save. The server converts the track to AAC/M4A for browser playback.

Supported uploads: MP3, M4A, AAC, WAV, OGG, and FLAC, up to 100 MB and two hours. Some original formats cannot be previewed by every browser; conversion occurs when saved. One track belongs to the whole post, including all carousel items. Its transport includes Play/Pause, seek, and volume (full viewer); the compact wall player includes Play/Pause and seek. The global speaker toggle also mutes soundtrack audio. Phones may use their device volume control.

Audio follows the viewed wall post and stops when scrolling away, changing the selected post, opening management, closing the viewer, leaving the tab, or handing playback to the TV. Browsers may require a tap before audible audio. A soundtrack cannot override browser autoplay policy.

Drag in another file to replace the track. Use the soundtrack trash button to remove it. Changes are saved with the post; canceled drafts do not delete existing audio. Only upload soundtracks you have permission to publish.

## Cast with sound

In Chrome, casting uses the normal Google Cast receiver. Safari uses native AirPlay through the same Cast button. The server prepares a compatible MP4 that combines the selected image/video with its soundtrack, trim, volume, loop, and original-audio setting. The TV receives that media file, not the webpage or a separate browser audio stream. Preparation may take longer for large videos. A single cast photo repeats its prepared slide. Favorites presentation photos use the selected photo duration. Each cast carousel/favorite item starts its soundtrack segment at the configured trim start; a continuous cross-item soundtrack is available locally within a post, not across separately queued TV files.

## Five gallery themes

Use **Theme** on the wall or Favorites page:

- **Gold** — the default: obsidian black, champagne lighting, warm editorial dates.
- **Graphite** — neutral carbon/silver studio lighting with thin gold borders.
- **Porcelain** — a light gallery: warm paper, ink typography, bronze controls, and understated gold hairlines.
- **Midnight** — deep indigo stages, moonlit blue accents, and crisp pale text.
- **Verdant** — forest-dark surfaces, sage accents, and warm ivory typography.

Preferences are saved per browser and hostname. New visitors start in Gold. Media keeps its original colors. Full-screen theater and media controls retain a dark cinema stage, including when Porcelain is selected. Reduced-motion preferences are respected.

## Upgrade notes

Soundtrack fields were added to `Post` in v1.2.0. v1.3.0 adds no further schema changes. Back up SQLite, uploads, and private environment files before deployment. Run `pnpm exec prisma db push` with the new schema; do not use `--accept-data-loss` or reset the database. Existing posts get empty soundtrack defaults and keep their media/order. Generate the client, build, and restart your application. Preserve the former build and a private database backup for rollback.
