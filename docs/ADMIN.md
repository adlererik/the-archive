# Administration and login

By Erik Adler.

Open `/admin/login` and enter your username and password. On a new database, the environment variables `ADMIN_USERNAME` and `ADMIN_PASSWORD` establish the initial account. The database then stores the username and a salted password hash. Changing `.env.local` does not replace an existing account.

Use the cogwheel → Login settings to change the username or password with the current password. Old sessions are revoked after a change. If you lose access, set the desired `ADMIN_USERNAME` and `ADMIN_PASSWORD` in private `.env.local`, then run `./archive reset-login` locally from the project directory. This replaces the stored login and revokes existing sessions. Keep real passwords and session secrets in `.env.local`; never commit that file.

## Optional Cloudflare sign-in

The default mode is **Username & password**, so a normal installation or localhost clone works without Cloudflare. Owners can choose **Cloudflare sign-in** in the cogwheel → Login settings after the integration below is configured. This mode skips the CMS password form and admits only the configured owner's verified Cloudflare identity. Switching modes revokes existing CMS sessions. Switching back to password login requires the current CMS password to confirm that the owner can still sign in.

Configure a Cloudflare Access self-hosted application covering `/admin`, `/api/admin`, and `/api/posts/*` on the public hostname. Use one Allow policy with the exact owner's email; do not add Everyone, bypass rules, or other allowed accounts. Copy the application's **Application Audience (AUD)** tag, not its application ID. Set these values privately in `.env.local` and restart the server:

```dotenv
SESSION_COOKIE_SECURE="true"
CLOUDFLARE_ACCESS_TEAM_DOMAIN="your-team.cloudflareaccess.com"
CLOUDFLARE_ACCESS_AUD="your-64-character-application-audience-tag"
CLOUDFLARE_ACCESS_EMAIL="owner@example.com"
CLOUDFLARE_ACCESS_HOSTNAME="archive.example.com"
ADMIN_AUTH_MODE="password"
```

Open Login settings through the protected public domain to enable Cloudflare sign-in. The CMS verifies the signed Access token's signature, issuer, audience, owner email, expiry, and public hostname before allowing the switch or creating an admin session. A plain email header is insufficient. An unavailable or invalid token never falls back to password authentication in Cloudflare mode. The CMS session cannot outlast the Access token that created it. Sign out clears the CMS cookie and uses Cloudflare's logout endpoint; this also ends the user's other Access sessions and can show Cloudflare's signed-out page.

The choice is stored privately in `.runtime/admin-auth.json`; it overrides `ADMIN_AUTH_MODE`. Include that file in private installation backups. To recover locally, set that file to `{"mode":"password"}` and use `./archive reset-login` if the password is lost. `ADMIN_AUTH_MODE="cloudflare"` can also enable a newly configured installation before a choice has been saved through the UI.

### Free sign-in methods and device support

Provider features and plan terms can change; consult the official references below. Cloudflare integration is an optional advanced setup.

Cloudflare Zero Trust Free currently supports up to 50 users. The normal Google identity-provider integration works with personal Google accounts and does not require Google Workspace. It requires an OAuth client configured in Google's console. Cloudflare's own identity provider can instead use Cloudflare accounts with supported social login, including Google and Apple. Apple users must use a Cloudflare account whose email matches the policy's approved email; an Apple private relay address will not match a different owner email. A standalone Apple provider is not included in this CMS integration.

Access also supports enrolled device biometrics such as Touch ID, Face ID, and Windows Hello as an additional factor. Requiring Access independent MFA means Google sign-in alone is insufficient: a matching enrolled factor is still required when its session expires. For a provider-only flow, configure the Access policy accordingly and rely on the identity provider's account verification. Google and Apple can ask for account selection, consent, passkeys, or other verification; a single click is not guaranteed.

Phone-assisted passkey QR prompts belong to the browser or identity provider. On supported device/browser combinations, choose a passkey from another device and scan its QR prompt with the enrolled phone. Some combinations require Bluetooth proximity. The CMS cannot force this option on every desktop, and scanning an ordinary link to the gallery does not authenticate a desktop session. No custom QR approval service, paid Apple developer integration, paid identity subscription, or paid Cloudflare feature is required by this optional integration. Domain registration and your own server/Internet costs remain separate.

References: [Cloudflare Free plan](https://www.cloudflare.com/plans/zero-trust-services/), [Google identity provider](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/google/), [Cloudflare social login](https://developers.cloudflare.com/fundamentals/user-profiles/login/), [independent MFA](https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/independent-mfa/), and [cross-device passkeys](https://developers.google.com/identity/passkeys/use-cases).

After signing in, the icon row beneath the gallery divider includes a square-plus for media and a cogwheel at its right end for settings. The square-plus opens `/admin`, keeping the **A new chapter** uploader, carousel arrangement, captions, dates, and soundtracks together. In-place wall editing still reorders, adds, or removes carousel assets, extends a single post into a carousel, changes captions/timestamps, or deletes a post and its local media. See [carousel, soundtrack, and theme instructions](CAROUSELS-SOUNDTRACKS-THEMES.md).

The cogwheel opens `/admin/settings`: visitor history, gallery header text, login settings, and all included information/documentation. Both pages require a valid administrator session; the public gallery hides the cogwheel and square-plus when signed out. Login/logout remains separate in the top-right corner.

Visitor history shows the connection IP, an OS icon, country flag/name, approximate city, browser, and visit time. Only outside visits are recorded and displayed. Private/local IPs are excluded. A verified signed CMS session marks that visitor identity and public IP as the owner; these exclusions persist after logout and hide matching older records without deleting them. New browsers or changed addresses may be counted until you sign in there. Owner exclusions are stored privately in `.runtime/visitor-exclusions.json`. City estimates are available only for resolvable public addresses. Behind a trusted local Cloudflare Tunnel, the server reads [Cloudflare's original client IP headers](https://developers.cloudflare.com/fundamentals/reference/http-headers/#cf-connecting-ip); direct LAN requests use the socket address. Forwarded headers from untrusted connections are ignored.

Records remain in the local database until manually deleted. Browse older history in pages of 50. Delete one record with its trash icon or use **Delete all visit history**; both ask for confirmation. Deleting visits does not remove posts, media, browser-local favorites, hearts, or settings. Previous pruning or discarded IPs cannot be undone by this update. Keep private backups of the database when preserving history.

Use HTTPS with secure cookies before exposing the archive on a server. Source control and backups have different purposes: Git contains application code; a private backup contains the database, uploads, and environment configuration needed to recover your archive.

## Step-by-step guides

- [Share one media item or a compilation](SHARING.md)
- [Visitor statistics and history deletion](VISITOR-STATS.md)
- [Private backup and migration](OPERATIONS.md#backups-and-migration)
- [Beginner installation and first upload](BEGINNER-GUIDE.md)
