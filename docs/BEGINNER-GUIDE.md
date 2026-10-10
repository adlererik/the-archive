# Beginner guide: run your own Archive

By Erik Adler. Stable release: v1.3.0.

This is your own Instagram-style photo/video website. Your computer or server stores the files and runs the CMS. A computer must stay powered on for other people to reach it. Start locally, add a few memories, then give it a public HTTPS address. You do not need Cloudflare, Google, Apple, or a fingerprint reader to install or sign in: new installations use a CMS username and password.

The first supported walkthrough uses **Debian or Ubuntu Linux** and a normal user account with sudo access. Commands go in the **Terminal** app, or your SSH terminal for a headless server. Paste one block at a time. Text in angle brackets is an explanation, not something to paste.

## 1. Install basic tools

```bash
sudo apt-get update
sudo apt-get install -y git curl ca-certificates xz-utils ffmpeg
```

Sudo may ask for your computer/server password. Typing it shows no characters; press Enter afterwards. FFmpeg prepares thumbnails, compatible videos, and the photo slides used by TVs.

## 2. Download the project

```bash
cd ~
git clone --branch v1.3.0 https://github.com/adlererik/the-archive.git
cd the-archive
```

The project is now in a folder called `the-archive` in your home directory. Downloading a release ZIP and extracting it is an alternative; open Terminal inside that extracted folder and continue below.

## 3. Install Node.js 24 and pnpm

If `node --version` already reports 24 or newer and `pnpm --version` reports 12.10.1, skip this step. Otherwise this block downloads the official Node 24 Linux build, checks its published checksum, and installs it privately inside this project. It supports the common x64 and ARM64 machines.

```bash
bash <<'ARCHIVE_NODE_SETUP'
set -euo pipefail
mkdir -p .runtime/node .runtime/node-download
cd .runtime/node-download
case "$(uname -m)" in
  x86_64) archive_node_arch=x64 ;;
  aarch64|arm64) archive_node_arch=arm64 ;;
  *) echo "Use a supported 64-bit Linux machine."; exit 1 ;;
esac
curl -fsSLO https://nodejs.org/dist/latest-v24.x/SHASUMS256.txt
archive_node_package=$(awk -v suffix="linux-${archive_node_arch}.tar.xz" '$2 ~ (suffix "$") {print $2; exit}' SHASUMS256.txt)
test -n "$archive_node_package"
curl -fsSLO "https://nodejs.org/dist/latest-v24.x/$archive_node_package"
awk -v file="$archive_node_package" '$2 == file' SHASUMS256.txt | sha256sum --check -
tar -xJf "$archive_node_package" -C ../node --strip-components=1
cd ../..
export PATH="$PWD/.runtime/node/bin:$PATH"
npm install -g pnpm@12.10.1
node --version
pnpm --version
ARCHIVE_NODE_SETUP
export PATH="$PWD/.runtime/node/bin:$PATH"
```

Stop if a download or checksum check fails. Official reference: [Node.js downloads](https://nodejs.org/en/download). In a new terminal, return to the project folder and run `export PATH="$PWD/.runtime/node/bin:$PATH"` before using pnpm directly. The `./archive` commands find the private Node runtime automatically.

## 4. Set up the empty gallery

```bash
./archive setup
```

This installs the pinned dependencies, creates your private settings and an empty database, and compiles the site. It can take several minutes. Wait until it finishes successfully.

Read your generated initial password locally:

```bash
sed -n '/^ADMIN_PASSWORD=/p' .env.local
```

Your username is **admin**. Use the text between the quotation marks as the password. Keep it private and save it in your password manager; do not paste it into a public issue or chat. Setup generates a different password and session secret for every installation and sets `ADMIN_AUTH_MODE="password"`. The example settings file is a reference, not your generated password.

For age labels, edit `NEXT_PUBLIC_BIRTH_DATE` in `.env.local` to the relevant birthday in `YYYY-MM-DD` format before the next build. Run `./archive build` after changing this setting.

## 5. Start and open your site

```bash
./archive start
```

Keep this terminal open. On the same computer, open **http://localhost:3000** in your browser. If installing on a server, use its local network address with `:3000`, for example `http://192.168.1.50:3000`. Use the address printed by the launcher; localhost on your phone means the phone itself.

If port 3000 is busy, stop the program already using it. The launcher will not silently start a second copy on 3001.

## 6. Sign in and add your first memory

1. Tap the lock at the top-right of the gallery, or add `/admin/login` to its address.
2. Enter **admin** and your generated password.
3. Open the cogwheel at the far right of the icon row below the header divider. Under **Login settings**, choose your own username/password using the current password. Save it in your password manager. Leave **Username & password** selected.
4. Use the square-plus icon to open **A new chapter**, the media uploader. Drop or select a JPG, PNG, WebP, MP4, or MOV file.
5. Choose several files for a carousel. Review their order before saving.
6. Set the date/time; an old memory can be backdated.
7. Write a caption and save. Open the wall to see it in chronological order.
8. Under the cogwheel, **Header text** changes the title and introduction; **Info & documentation** opens the handbook. The unlocked icon at the top-right signs you out.

Administrators get **Edit** on each wall post. Reorder its items by dragging or using move buttons, add more images/videos to turn a single post into a carousel, and remove individual items. Save changes when finished. **Insert here** starts a new memory near that date; you can always choose an exact date/time.

In **Soundtrack**, drop or choose an audio file, preview it, set trim start/end, volume, and looping, and decide whether to mute the video's original audio. Save the post. See the [editing and soundtrack guide](CAROUSELS-SOUNDTRACKS-THEMES.md).

Use **Theme** to choose Gold (the default), Graphite, light Porcelain, Midnight, or Verdant. Deleting a post or media removes its local files; make a backup first if you might need them again.

## 7. Find favorites and make a presentation

1. Turn on **Thumbnail wall** to see every photo/video, including carousel contents.
2. Use **Jump to year** to find older memories.
3. Click/tap a thumbnail to inspect it; closing restores your browsing position.
4. Tap its small star to save that particular image/video. Hearts like whole posts.
5. Open **Favorites** using the film-reel icon and its item count; use its controls to arrange the order.
6. Choose a photo duration, optionally enable Repeat, and press **Play presentation**.

Favorites and the theme are saved in this browser for this website address. Backing up the server does not back up browser favorites.

### Send one photo/video or a compilation

On a wall picture/video, the paper-plane **Send to** icon creates a direct link to that selected item. For a compilation, arrange Favorites, choose photo duration and Repeat, then use **Send to** on the Favorites page. Choose **Copy link**, **Email**, **Message**, or **Share with your apps** if your browser supports it. Email and Message open your own app; you decide the recipient and send the message.

Your friend or grandmother opens one compact `/s/...` link without signing in. The presentation plays photos and complete videos in order and repeats when selected. Some browsers require Play or Tap for sound. They can pause, seek a video, move between memories, adjust speed, and use fullscreen where supported. Messaging thumbnail previews depend on the receiving app. Use a stable public HTTPS address before sending links outside your home; a LAN address or localhost will not work for distant recipients. See [the sharing guide](SHARING.md).

### View visitor history

After publishing the gallery, open **cogwheel → Visitor stats**. See outside visitors' public IPs, country flags, approximate cities, OS/browser, and counts. Local traffic and recognized owner traffic are excluded. Sign in on each browser/address you use to identify it as yours. History stays until you delete it; a trash button removes one visit, and **Delete all visit history** removes all visits after confirmation. See [visitor statistics](VISITOR-STATS.md).

## 8. Make the site start at boot

Stop the foreground launcher from a second terminal in the project folder:

```bash
./archive stop
sudo bash deploy/setup-debian-root.sh "$USER"
systemctl is-enabled "the-archive@$USER"
systemctl is-active "the-archive@$USER"
```

Both checks should print `enabled` and `active`. The service runs as your normal account and starts after a reboot, even without an SSH login. Keep the checkout in a simple path such as your home directory's `the-archive` folder. Use this service instead of also running `./archive start`.

## 9. Give it a public HTTPS address

A Cloudflare Tunnel connects your server outward to Cloudflare. Install the official **cloudflared** binary for your Linux architecture at `/usr/local/bin/cloudflared`, using [Cloudflare's official download/install instructions](https://developers.cloudflare.com/tunnel/downloads/). Keep the application boot service running, then run:

```bash
sudo bash deploy/setup-cloudflare-root.sh "$USER"
```

The script enables the tunnel boot service and prints a temporary HTTPS address. Use that address for Admin after this step. The HTTPS address is also needed for normal mobile Google Cast use.

For a permanent name:

1. Buy a domain or add your existing domain to Cloudflare.
2. Open **Networking → Tunnels → Create Tunnel** and name it `the-archive`.
3. Select your server environment and find the tunnel token in the install command.
4. In the project folder, run `sudo bash deploy/use-named-cloudflare-tunnel.sh` and paste **only the token** at its hidden prompt.
5. When the dashboard shows **Healthy**, open **Routes → Add route → Published application**.
6. Choose your domain, leave the subdomain blank for the main address, and set **Service URL** to `http://localhost:3000`.
7. Save the route. Add a second `www` route if you want that address too.
8. Open your new HTTPS address and its `/admin/login` page.

Cloudflare configures the route's DNS record. Keep the token private. A Quick Tunnel address changes on restart; a named tunnel preserves your configured domain. See [Cloudflare setup](CLOUDFLARE.md) and the [official dashboard guide](https://developers.cloudflare.com/tunnel/get-started/).

## 10. Show media on your TV

1. Put your phone/computer and TV on the same Wi-Fi. Open the gallery's **HTTPS** address.
2. **Android or desktop Chrome:** use a Chromecast or Google Cast-compatible TV.
3. **iPhone, iPad, or Mac Safari:** use a TV/receiver that supports **AirPlay**, and enable AirPlay in its settings. Google Cast support alone does not mean a TV supports AirPlay.
4. Press the **same Cast overlay** on your selected photo/video and choose the TV. Safari opens Apple's native device picker.
5. For a slideshow, open Favorites and select **Cast presentation**.
6. Use playback controls or **Stop casting** when finished.

The TV receives selected media, not the webpage. It must be able to download that media without an admin cookie. Guest Wi-Fi isolation can prevent discovery. Use Safari on Apple devices; Chrome on iOS is not supported by Google's sender SDK. Google Cast queues run on the receiver; keep the Safari page active for AirPlay presentation advancement. If local audio needs permission, tap Play or the speaker once. See [casting details](FAVORITES-CASTING.md).

## 11. Stop, restart, or reboot

For the foreground launcher, use a second terminal in the project folder:

```bash
./archive status
./archive stop
./archive restart
```

For the boot service:

```bash
sudo systemctl stop "the-archive@$USER"
sudo systemctl start "the-archive@$USER"
sudo systemctl restart "the-archive@$USER"
sudo systemctl status "the-archive@$USER" --no-pager
sudo journalctl -u "the-archive@$USER" -n 50 --no-pager
```

The tunnel has separate controls: `sudo systemctl restart the-archive-tunnel`. `sudo reboot` reboots the machine; enabled services return automatically. Do not reboot while other work on that machine needs to remain running.

## 12. Back up, upgrade, and move servers

Before upgrades, stop the application and make a **private backup** of `prisma/dev.db`, `public/uploads/`, `.env`, `.env.local`, and the private runtime files listed in [Operations](OPERATIONS.md#backups-and-migration), especially `.runtime/shared-links/` so sent URLs keep working. Include all generated media in uploads. Record the current release. Store the backup outside the checkout and protect it like your passwords and photos. Then restart the service if continuing to use the site.

To upgrade to this release, **stop the site and back it up first**, then run these in its project folder:

```bash
git rev-parse HEAD  # Write down this old revision for rollback.
git fetch origin --tags
git checkout v1.3.0
./archive install
export PATH="$PWD/.runtime/node/bin:$PATH"  # If you installed the private Node runtime.
pnpm db:push
```

**v1.3.0 has no new database columns compared with v1.2.0.** When upgrading from v1.1.0 or earlier, this command also applies the optional soundtrack fields introduced in v1.2.0. Review Prisma's output. Stop if it asks to reset data or remove data; never add `--accept-data-loss`. Existing posts retain their media and order. After the schema update, a foreground installation uses `./archive build` then `./archive start`. For systemd, use `sudo bash deploy/rebuild-archive-root.sh "$USER"`. That script preserves the previous build, but does not roll back the database or Git revision; keep your private backup.

For future releases, substitute their tag and follow their migration notes. If installed from a ZIP rather than Git, extract the new source into a separate folder and follow the migration instructions instead of running Git commands.

To migrate, install prerequisites/source on the new server, restore the private files to their matching paths, install dependencies, build, and check the gallery/login/media before changing your domain's tunnel route. A named tunnel can have multiple replicas; retiring the old server's connector is part of a planned migration. See [full backup and migration instructions](PUBLIC-SETUP.md).

## Optional: sign in through Cloudflare

Keep the default username/password mode for the simplest installation. If you later want to skip the CMS password form, configure the optional owner-only Cloudflare Access integration in [Administration](ADMIN.md#optional-cloudflare-sign-in). HTTPS hosting alone does not enable it. Google and Apple-related sign-in, biometrics, and phone-assisted passkey QR prompts depend on your chosen identity provider and devices. Do not select this mode until the configuration and your allowed owner identity are ready.

## Common questions

- **Empty wall?** A new installation has no posts. Upload through Admin or [import your own extracted Instagram export](../README.md#import-an-instagram-export).
- **Not found on another phone?** Keep the server running, use its LAN address on the same Wi-Fi, and check the machine's firewall. Use HTTPS for public access and casting.
- **No sound yet?** Browsers can require one tap before audible playback; also check device volume.
- **Cannot sign in after enabling HTTPS?** Use the HTTPS domain. Secure cookies do not work on an ordinary HTTP LAN address.
- **Lost your password?** On your server, edit `ADMIN_USERNAME` and `ADMIN_PASSWORD` in private `.env.local`, then run `./archive reset-login` from the project folder. [Recovery instructions](ADMIN.md) explain existing-account behavior and optional Cloudflare mode recovery.
- **Will a shared link keep working?** Keep the server, hostname, source media, database, and `.runtime/shared-links/` available. A temporary tunnel address changes after restart.
- **What does it cost?** The CMS and its sharing/casting code require no paid subscription. Your server, disk space, electricity, Internet, domain, and optional receiver/services can cost money.
- **Can I put this in GitHub?** Publish source only. Never add uploads, SQLite files, private `.env` files, backup archives, or tunnel tokens.
- **Is the gallery private?** Admin is protected, but the published gallery/media are public. Share only a collection you want viewers to access and customize your visitor privacy notice.
