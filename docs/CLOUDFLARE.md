# Cloudflare HTTPS, domains, and server operations

By Erik Adler. Updated for v1.3.0. Cloudflare is optional; local installation and password login work without it.

## Server layout

On your Debian installation, the CMS serves port 3000 through `the-archive@youruser.service`; replace `youruser` with your account name. Its separate connector is `the-archive-tunnel.service`. Install Cloudflare's official cloudflared binary for your machine's architecture. The binary, runner, mode configuration, and systemd unit are installed outside the checkout:

- `/usr/local/bin/cloudflared`
- `/usr/local/libexec/the-archive-tunnel-run`
- `/etc/the-archive-tunnel/tunnel.env`
- `/etc/systemd/system/the-archive-tunnel.service`

The service runs as the installation owner, restarts after exits, starts at boot, and connects outbound to Cloudflare. It does not require opening inbound ports on the router. No application database or media migration is needed for a hostname change.

Cloudflare documents [Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/) as temporary development tunnels: their URL changes when the connector restarts, there is no uptime guarantee, and they have request and SSE limitations. Systemd makes the process persistent; it does not make a Quick Tunnel hostname permanent. A Quick Tunnel cannot simply become a custom-domain tunnel. An account-owned named tunnel is needed once. The prepared runner supports that change using the existing binary and systemd unit. After that one-time change, additional hostnames require only dashboard routes.

## Initial installation

Install the official binary at `/usr/local/bin/cloudflared`, or use the supported pinned staging binary described in [public setup](PUBLIC-SETUP.md). Run these commands from your checkout on the Debian server:

```bash
sudo bash deploy/setup-cloudflare-root.sh "$USER"
```

The installer verifies the binary, installs and enables the tunnel unit, sets `SESSION_COOKIE_SECURE=true` and `TRUST_PROXY=true` in `.env.local`, and restarts the application to apply them. A private environment backup is retained under `.runtime/`. The local proxy is trusted only for loopback connections. Admin login should now use the HTTPS address; plain HTTP LAN access still serves the gallery but cannot send secure session cookies.

When the connector receives its temporary hostname, the installer prints `LIVE HTTPS URL` and `CMS LOGIN`. To retrieve the current URL later:

```bash
archive_invocation="$(systemctl show the-archive-tunnel -p InvocationID --value)"
sudo journalctl -u the-archive-tunnel "_SYSTEMD_INVOCATION_ID=$archive_invocation" --no-pager -o cat | grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -n 1
```

The archive gallery is public through this URL, with the existing authenticated `/admin/login` route for management.

## Buy through Cloudflare Registrar

1. Open [Register domains in the Cloudflare dashboard](https://dash.cloudflare.com/?to=/:account/registrar/register), sign in, and select your account. This is the **Register domains** page under domain registration.
2. Enter your exact domain and select **Search**. Review its registration and renewal quote. Registry availability checks are preliminary; Cloudflare performs its definitive availability check after **Purchase** is selected.
3. Select **Purchase** beside the chosen domain.
4. Choose a one-year term under **Payment** (or the term you prefer). Review the renewal date and auto-renew setting.
5. Fill in accurate registrant contact details and payment information.
6. Review the displayed total, applicable taxes, and agreements; select **Complete purchase** yourself.
7. Follow the confirmation email's verification instructions. Cloudflare Registrar supplies Cloudflare nameservers automatically.

These steps follow the official [registration guide](https://developers.cloudflare.com/registrar/get-started/register-domain/). The official [price list](https://pricing.registrar.cloudflare.com/) supplies the standard registration and renewal totals. Mandatory registry and applicable ICANN charges are included; do not add another ICANN fee to the published total. Premium domains and taxes can change the checkout amount, and promotions can expire. Cloudflare's [registration agreement](https://www.cloudflare.com/domain-registration-agreement/) describes taxes based on billing details.

## Attach the purchased domain to the reusable service

1. Open [Networking → Tunnels](https://dash.cloudflare.com/?to=/:account/tunnels) in your Cloudflare account.
2. Select **Create Tunnel**, name it `the-archive`, and select **Create Tunnel**. If your dashboard offers a connector type, choose **Cloudflared**.
3. Under **Setup Environment**, select **Debian / Linux** and **64-bit**. The dashboard supplies an install/run command containing a tunnel token. Keep the token private. The connector is already installed, so use only the token with the prepared switch script instead of installing a second service.
4. On the Debian server, run:

   ```bash
   sudo bash deploy/use-named-cloudflare-tunnel.sh
   ```

   At the hidden prompt, paste **only the token**, not the full dashboard command. The script stores it in `/etc/the-archive-tunnel/token` with permission 600, switches `TUNNEL_MODE=named`, and restarts the same service. Tokens must never go into Git, chat, screenshots, or command arguments.
5. In the dashboard, wait for this connector to show **Healthy** and select **Continue**.
6. Select your tunnel → **Routes → Add route → Published application**.
7. Choose a hostname: use `www` as the subdomain and your purchased domain, or leave the subdomain empty for the apex domain if supported by the form.
8. Set **Service URL** to `http://localhost:3000` (or **Type: HTTP**, **URL: localhost:3000**, if the form uses separate fields).
9. Select **Add route**. Cloudflare creates the tunnel DNS route. Add a second route if you want both apex and `www`.
10. Open `https://your-domain/` and `https://your-domain/admin/login`. If there is a conflicting DNS record for the same hostname, replace that record with the tunnel route; do not point the public hostname at the server's private LAN address.

These dashboard labels follow the current [Cloudflare Tunnel setup guide](https://developers.cloudflare.com/tunnel/get-started/). Older Cloudflare Zero Trust dashboards may expose this under **Networks → Connectors → Cloudflare Tunnels**, with **Public Hostnames** instead of **Published application**. The destination remains the same local port 3000.

Buying the domain does not connect it to the Quick Tunnel automatically. This one-time named-tunnel enrollment gives the connector a stable identity. Afterward, additional hostnames use steps 6–9 without rebuilding or reinstalling the service.

## Stop, restart, boot, and update

Run these on the Debian server:

```bash
sudo systemctl status the-archive-tunnel --no-pager
sudo systemctl stop the-archive-tunnel
sudo systemctl start the-archive-tunnel
sudo systemctl restart the-archive-tunnel
systemctl is-enabled the-archive-tunnel
systemctl is-active the-archive-tunnel
sudo journalctl -u the-archive-tunnel -n 100 --no-pager
```

Stopping the tunnel removes public access while the LAN site can stay running. Stopping the application uses `sudo systemctl stop the-archive@youruser`. Both enabled services start at boot. To disable tunnel boot startup, use `sudo systemctl disable --now the-archive-tunnel`. Re-enable it with `sudo systemctl enable --now the-archive-tunnel`.

Automatic binary updates are disabled because systemd supervises the process. To update, obtain a new official [cloudflared release](https://github.com/cloudflare/cloudflared/releases), verify its release digest, stop the tunnel, install the verified binary at `/usr/local/bin/cloudflared`, and restart it. Preserve `/etc/the-archive-tunnel/` and the systemd unit. Application updates follow [Operations](OPERATIONS.md) and do not require recreating the tunnel. A Quick Tunnel restart changes its URL; a named tunnel's configured custom hostname stays stable.

## Optional identity login, public links, and costs

Cloudflare Tunnel supplies HTTPS hosting; Cloudflare Access is a separate optional admin identity gateway. Keep standard CMS password login unless you deliberately configure and choose the integration in [Administration](ADMIN.md#optional-cloudflare-sign-in). Protect admin paths, not the whole gallery, public media, casting endpoints, or `/s/*` links; recipients and TVs need access without an admin session.

Cloudflare currently lists Zero Trust Free at $0 for teams up to 50 users; this project's optional owner-only Access setup fits that limit. Domain registration/renewal, your server/storage/Internet, optional paid Cloudflare products, and receiver hardware remain separate costs. Review the current [plan page](https://www.cloudflare.com/plans/zero-trust-services/) and your dashboard before enabling extras. The CMS does not create paid subscriptions.

Use a named tunnel and stable hostname for enduring shared URLs. A Quick Tunnel URL changes after restart, so old links sent to friends can stop working. Back up the private shared-link directory and source media. See [Sharing](SHARING.md).
