# Beginner guide: run your own Archive

By Erik Adler. Version 1.1.0.

This is your own Instagram-style photo/video website. Your computer or server stores the files and runs the CMS. A computer must stay powered on for other people to reach it. Start locally, add a few memories, then give it a public HTTPS address.

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
git clone --branch v1.1.0 https://github.com/adlererik/the-archive.git
cd the-archive
```

The project is now in a folder called `the-archive` in your home directory. Downloading a release ZIP and extracting it is an alternative; open Terminal inside that extracted folder and continue below.

## 3. Install Node.js 24 and pnpm

If `node --version` already reports 24 or newer and `pnpm --version` reports 12.10.1, skip this step. Otherwise this block downloads the official Node 24 Linux build, checks its published checksum, and installs it privately inside this project. It supports the common x64 and ARM64 machines.

```bash
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

Your username is **admin**. Use the text between the quotation marks as the password. Keep it private. Setup generates a different password and session secret for every installation.

For age labels, edit `NEXT_PUBLIC_BIRTH_DATE` in `.env.local` to the relevant birthday in `YYYY-MM-DD` format before the next build. Run `./archive build` after changing this setting.

## 5. Start and open your site

```bash
./archive start
```

Keep this terminal open. On the same computer, open **http://localhost:3000** in your browser. If installing on a server, use its local network address with `:3000`, for example `http://192.168.1.50:3000`. Use the address printed by the launcher; localhost on your phone means the phone itself.

If port 3000 is busy, stop the program already using it. The launcher will not silently start a second copy on 3001.

## 6. Sign in and add your first memory

1. Add `/admin/login` to your site address.
2. Enter **admin** and your generated password.
3. In Admin, change your username/password to ones you will remember.
4. Use the uploader to select or drop a JPG, PNG, WebP, MP4, or MOV file.
5. Choose several files for a carousel. Review their order before saving.
6. Set the date/time; an old memory can be backdated.
7. Write a caption and save. Open the wall to see it in chronological order.
8. Customize the title and introductory text in Admin. Use **Info** for these guides.

Administrators also get Edit controls on the wall for dates, captions, and deletion. Deleting removes the local media; make a backup first if you might need it again.

## 7. Find favorites and make a presentation

1. Turn on **Thumbnail wall** to see every photo/video, including carousel contents.
2. Use **Jump to year** to find older memories.
3. Click/tap a thumbnail to inspect it; closing restores your browsing position.
4. Tap its small star to save that particular image/video. Hearts like whole posts.
5. Open **Favorites** and use its controls to arrange the order.
6. Choose a photo duration, optionally enable Repeat, and press **Play presentation**.

Favorites and the theme are saved in this browser for this website address. Backing up the server does not back up browser favorites.

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

1. Use a Google Cast-compatible TV/Chromecast and supported Chrome, such as Android Chrome.
2. Connect your phone/computer and TV to the same network.
3. Open your gallery through its **HTTPS** address.
4. Press the Cast overlay on the photo/video and choose your TV.
5. For a slideshow, open Favorites and select **Cast presentation**.
6. Use the TV playback controls or **Stop casting** when finished.

The TV receives the media, not the webpage. It must be able to download that media without an admin cookie. Guest Wi-Fi isolation and unsupported browsers can prevent discovery. Chrome on iOS is not supported by Google's sender SDK. If audio needs permission locally, tap the speaker or Play once. See [casting details](FAVORITES-CASTING.md).

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

Before upgrades, stop the application and make a **private backup** of `prisma/dev.db`, `public/uploads/`, `.env`, and `.env.local`. Include all generated media in uploads. Record the current release. Store the backup outside the checkout and protect it like your passwords and photos. Then restart the service if continuing to use the site.

To upgrade, substitute the new release tag:

```bash
git fetch origin --tags
git checkout v1.1.0
./archive install
```

Review that release's schema instructions. This release requires **no database schema change from v1.0.0**. For systemd, use `sudo bash deploy/rebuild-archive-root.sh "$USER"`; it stops, rebuilds, and restarts with a previous-build fallback. For a foreground setup use `./archive stop`, `./archive build`, and `./archive start`.

To migrate, install prerequisites/source on the new server, restore the private files to their matching paths, install dependencies, build, and check the gallery/login/media before changing your domain's tunnel route. A named tunnel can have multiple replicas; retiring the old server's connector is part of a planned migration. See [full backup and migration instructions](PUBLIC-SETUP.md).

## Common questions

- **Empty wall?** A new installation has no posts. Upload through Admin or [import your own extracted Instagram export](../README.md#import-an-instagram-export).
- **Not found on another phone?** Keep the server running, use its LAN address on the same Wi-Fi, and check the machine's firewall. Use HTTPS for public access and casting.
- **No sound yet?** Browsers can require one tap before audible playback; also check device volume.
- **Cannot sign in after enabling HTTPS?** Use the HTTPS domain. Secure cookies do not work on an ordinary HTTP LAN address.
- **Can I put this in GitHub?** Publish source only. Never add uploads, SQLite files, private `.env` files, backup archives, or tunnel tokens.
- **Is the gallery private?** Admin is protected, but the published gallery/media are public. Share only a collection you want viewers to access and customize your visitor privacy notice.
