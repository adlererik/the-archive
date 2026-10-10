# The Archive

### Your own Instagram replacement: photos, videos, and memories on your server

By **Erik Adler** · Latest release **v1.3.0** · [MIT license](LICENSE)

Give your memories a home you control. The Archive combines an Instagram-style timeline, a cinematic gallery, a built-in CMS, and presentations you can share with **one short URL**. Keep your original photos and videos on your own server. Browse them on a phone, send a collection to family, or play it on a TV with **Google Cast or AirPlay**.

**New installations use a normal CMS username and password. No Cloudflare account, fingerprint reader, or social login is needed to install, clone, or sign in.** Optional Cloudflare sign-in is an owner's later choice.

## Why I built it — and why it suits my memories better

By Erik Adler:

> I wanted a home for my memories that I could own and run myself. Instagram is a walled garden. I tried Pixelfed, but in my experience it was too limited, felt clunky, and did not work well for what I needed. I built The Archive to preserve my original photos and videos, present them beautifully, find older memories quickly, and share them on a TV without depending on a social platform.

For this personal sharing workflow, the advantages are concrete:

- **Own the collection:** keep original files and a portable SQLite database on your server, with private backups you control.
- **Share a whole story:** mix photos and videos, arrange Favorites, and send one link that plays the collection in order and can repeat.
- **Make viewing easy for family:** recipients open a link without an account or an app; thumbnail previews appear in messaging apps that support them.
- **Bring memories to the big screen:** send selected media or a presentation to compatible Google Cast and AirPlay receivers.
- **Find the past quickly:** use a continuous timeline, a compact wall of every carousel item, and year jumps.
- **Curate beyond an upload feed:** backdate posts, reorder carousel items, add soundtracks, and choose a gallery theme.
- **Keep administration together:** a discreet login icon and a settings cogwheel give you media tools, visitor history, and the handbook.

The comparison above describes Erik's experience and priorities. This project focuses on a personal gallery and CMS. It does not provide follower feeds, direct messaging, or a federated social network.

## Project screenshots

The project's existing screenshots are preserved below. They illustrate the gallery; a fresh installation starts empty with your own media.

<img width="1080" height="2404" alt="24905" src="https://github.com/user-attachments/assets/f4bfb770-9cc0-4cd7-b3e3-cafffa898c91" />

<img width="1080" height="2404" alt="24908" src="https://github.com/user-attachments/assets/acf4d090-19e5-4658-bb5d-2a81b5ca2dfb" />

<img width="1080" height="2404" alt="24910" src="https://github.com/user-attachments/assets/e5b9ca24-3581-4702-a6b3-62ad74fd41f3" />


## Start here

**New to servers? Follow the [beginner guide](docs/BEGINNER-GUIDE.md).** It explains the terminal commands, first login, first upload, sharing, TV playback, public HTTPS, startup at boot, backups, and recovery.

- [Download v1.3.0](https://github.com/adlererik/the-archive/releases/tag/v1.3.0)
- [All features](docs/FEATURES.md)
- [Installation and migration reference](docs/PUBLIC-SETUP.md)
- [Sharing, presentations, and casting](docs/FAVORITES-CASTING.md)
- [Administration and visitor history](docs/ADMIN.md)
- [Release notes](docs/RELEASE-v1.3.0.md)

## What makes The Archive useful

| Feature | What you can do |
| --- | --- |
| One link for a compilation | Select photos and videos, arrange them in Favorites, and share a continuous presentation using one compact URL. |
| Direct media links | Send a particular photo or video with Copy link, Email, Message, or the device's share sheet where available. |
| Easy viewing for recipients | No account needed; presentations advance through timed photos and full videos, with repeat, pause, seeking, speed, and fullscreen where supported. |
| Link previews | Open Graph thumbnail metadata gives compatible messaging apps a preview of the first item. |
| Google Cast and AirPlay | Send selected media to a compatible TV from supported Chrome or Apple Safari. The page and admin controls stay off the TV. |
| Favorites presentations | Save individual carousel items, reorder them, choose photo duration, and play locally or on a TV. |
| Continuous timeline | Browse newest first, scroll seamlessly into older memories, and read captions, dates, and configurable age labels. |
| Fast thumbnail wall | Browse every photo/video in a compact grid, jump to a year, open an exact item, and return to your scroll position. |
| Carousel navigation | Swipe, tap the item counter, or choose a thumbnail; edit ordering and add or remove items later. |
| Desktop and mobile viewers | Cinematic desktop theater, inline mobile media, native video controls, and keyboard navigation. |
| Discreet controls | A small top-right icon column fades after inactivity; matching translucent buttons leave more of the picture visible. |
| Controlled sound | Sound is requested by default, deliberate mute is respected, and one active wall video prevents overlapping audio. |
| Five themes | Gold, Graphite, light Porcelain, Midnight, and Verdant; your media keeps its original colors. |
| Post soundtracks | Upload audio, preview, trim, adjust volume, loop, and choose whether to keep original video sound. |
| Built-in CMS | Drag/drop uploads, multi-file carousels, backdated memories, caption/date editing, and insertion anywhere in the timeline. |
| Visitor history | Outside visits with public IP, country flag, approximate city, OS/device/browser, and counts; recognized owner/local visits are excluded. |
| Persistent statistics | History stays until you manually delete one visit or all history; older records are paginated. |
| Simple default login | A unique username/password installation with local recovery; optional verified Cloudflare identity login for owners who configure it. |
| Settings and handbook | The cogwheel contains header text, visitor history, login settings, and included documentation; the square-plus keeps uploads separate. |
| Hearts | Like an entire post separately from saving an individual photo/video to Favorites. |
| Instagram export import | Import your own downloaded export, preserving dates and carousel order and repairing common caption encoding issues. |
| Local preservation | Keep originals, previews, compatible playback files, and SQLite data on your server. |
| Your own domain and server | Debian/Ubuntu setup, boot services, optional Cloudflare HTTPS tunnels, and backup/migration instructions. |

See [features and practical limits](docs/FEATURES.md).

## Quick installation

Supported walkthrough: **Debian/Ubuntu Linux**, a normal user with sudo, **Node.js 24+**, **pnpm 12.10.1**, **FFmpeg / FFprobe**, **Git**, and **Bash**. The beginner guide supplies prerequisite commands; do not run application setup as root.

Once those tools are installed:

```bash
git clone --branch v1.3.0 https://github.com/adlererik/the-archive.git
cd the-archive
./archive setup
./archive start
```

Open [http://localhost:3000](http://localhost:3000) on that computer, or the server's printed LAN address from another device. Setup installs locked dependencies, creates an **empty database**, generates a unique password and session secret, explicitly selects **password login**, and builds the app. Username: **admin**. Read your generated password privately from `.env.local`, then use the top-right lock or `/admin/login`. Store the login in your password manager.

After signing in, **square-plus → A new chapter** uploads media. **Cogwheel → Login settings** changes your login; **Header text** personalizes the gallery. The unlocked icon at the top right signs you out. The [beginner guide](docs/BEGINNER-GUIDE.md) covers every step and recovery if you lose your password.

Release ZIP/tarball downloads contain audited source, guides, schema, and the dependency lockfile. Setup installs dependencies. Compare downloaded assets with the supplied `SHA256SUMS`.

## Send a compilation to family

1. Tap the star on each photo/video you want, including individual carousel items.
2. Open Favorites using the film-reel icon and its selected-item count.
3. Arrange the order, choose how long photos display, and choose Repeat.
4. Tap the paper-plane **Send to** icon; copy the link or open an email, message, or native share sheet.
5. The recipient opens that one link to watch the selection in order, without signing in.

A link looks like `https://your-domain.example/s/AbCdEf0123456789`. It keeps the original selection/order even if you later change your browser Favorites. Deleting source media makes that media unavailable in shared views. Your server must remain online, and a stable domain keeps links working. Browsers can require one Play or Tap for sound interaction; automatic sound cannot be guaranteed.

## Run and maintain it

```bash
./archive status
./archive stop
./archive build
./archive start
./archive restart
```

Run these inside the project folder. A foreground server needs its terminal to remain open. The default listener is `0.0.0.0:3000`; a busy port gives an error. For reliable startup after reboot, follow the [boot service guide](docs/BEGINNER-GUIDE.md#8-make-the-site-start-at-boot). Back up SQLite, uploads, private environment files, and private runtime settings/shared links as described in [Operations](docs/OPERATIONS.md).

## Import an Instagram export

Extract your own export locally, then run:

```bash
INSTAGRAM_EXPORT_DIR="/path/to/your/extracted-export" pnpm import:instagram
```

The importer reads JSON from disk, preserves timestamps/carousels, fixes common caption encoding, and copies your media into `public/uploads/`. Previously imported source IDs prevent duplicates. You do not need to provide Instagram login credentials. Import media you are entitled to publish.

## TV playback and sound

Google Cast requires a supported Chrome browser and compatible receiver; native AirPlay requires Safari and an AirPlay-compatible receiver. A Chromecast-only TV does not automatically support AirPlay. Use receiver-reachable HTTPS media and allow discovery on your network. The Cast icon is hidden when the browser lacks the required API.

Google Cast presentation queues run on the receiver. AirPlay presentation advancement depends on the sender page remaining active. FFmpeg prepares photo slides and compatible video/soundtrack files locally. Browsers may require a tap for audible playback; native player controls and a speaker toggle remain available. Favorites/themes are stored per browser and site address.

## Privacy, costs, and ownership

**Release downloads contain no private passwords, tokens, account configuration, personal media files, populated databases, visitor records, private backups, runtime binaries, or compiled builds.** Each installation supplies its own collection and receives its own credentials. The intentionally published README screenshot links remain.

The published gallery, media, and shared links are public. Admin and visitor IPs require authentication. Visitor history is local, has no automatic deletion, and excludes local/recognized owner traffic. Customize the included visitor privacy notice for your deployment.

The software is **MIT licensed** and requires no paid sharing API, link shortener, casting registration, or CMS subscription. Hosting, storage, electricity, Internet service, domain registration/renewal, and receiver hardware are your own costs. Optional Cloudflare services have their own plan limits; the standard password login works without them. See [optional identity setup and current plan references](docs/ADMIN.md).

Built with Next.js, TypeScript, Tailwind CSS, Framer Motion, Lucide, Prisma, and SQLite. See [security](SECURITY.md), [release notes](docs/RELEASE-v1.3.0.md), and [changelog](docs/CHANGELOG.md). Instagram is a trademark of its owner; this independent project is not affiliated with Instagram or Meta.
