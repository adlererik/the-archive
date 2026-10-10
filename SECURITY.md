# Security and private installation data

By Erik Adler.

## Configuration

Run `./archive setup` to generate a unique admin password and a session secret. Fresh installations explicitly use CMS username/password login without Cloudflare. There are no usable shared login credentials in the release. A session secret must have at least 32 characters; the server rejects the template's placeholder. Keep `.env`, `.env.local`, and tunnel tokens private. Use HTTPS with `SESSION_COOKIE_SECURE=true` for public administration. Enable `TRUST_PROXY=true` only behind the intended loopback reverse proxy.

Admin account changes are stored as password hashes in SQLite; existing database account settings take precedence over environment bootstrap values. `./archive reset-login` is a local recovery command. Rotate credentials if they have been exposed, and back up private files separately.

## Public and private content

The gallery and its media endpoints are public by design so visitors and Cast receivers can fetch them. Admin writes require authentication. SQLite contains private account and visitor data. Uploads, databases, local environment files, import manifests, backups, runtime state, and authentication material are excluded from source packages.

The visitor database records public IP addresses and approximate device/location information for the administrator. Local IPs are suppressed. Recognized administrator browser/IP identities are excluded as well. History has no automatic deletion; the administrator can delete individual visits or all history. Customize the site's privacy notice for your deployment. Never attach a populated database, media, environment file, or credential-bearing log to a public issue.

## Optional identity login and share links

Cloudflare mode must be configured explicitly. The CMS verifies signed Access JWTs, including issuer, audience, exact owner email, expiry, and configured hostname. It does not authenticate a bare email header or fall back to the password form when Cloudflare verification fails. Configure Access policies on the admin paths described in [Administration](docs/ADMIN.md); leave public gallery/share/media routes available for recipients and TV receivers.

Shared links are public links to already public media, not a privacy boundary or password-protected album. Private `.runtime/shared-links/` files hold the ordered selections, and `.runtime/admin-auth.json` / `.runtime/visitor-exclusions.json` hold installation configuration. These files belong in private backups and never in source control. Preserve shared-link files and the hostname to retain sent links.

## Reporting a vulnerability

Contact the maintainer privately through the GitHub account linked by the repository before disclosing credential bypasses or private data exposure. Use GitHub private vulnerability reporting if available. Public issues are suitable for ordinary bugs with sanitized reproduction steps. Do not include passwords, session cookies, tokens, or personal media.
