# Security and private installation data

By Erik Adler.

## Configuration

Run `./archive setup` to generate a unique admin password and a session secret. There are no usable shared login credentials in the release. A session secret must have at least 32 characters; the server rejects the template's placeholder. Keep `.env`, `.env.local`, and tunnel tokens private. Use HTTPS with `SESSION_COOKIE_SECURE=true` for public administration. Enable `TRUST_PROXY=true` only behind the intended loopback reverse proxy.

Admin account changes are stored as password hashes in SQLite; existing database account settings take precedence over environment bootstrap values. `./archive reset-login` is a local recovery command. Rotate credentials if they have been exposed, and back up private files separately.

## Public and private content

The gallery and its media endpoints are public by design so visitors and Cast receivers can fetch them. Admin writes require authentication. SQLite contains private account and visitor data. Uploads, databases, local environment files, import manifests, backups, runtime state, and authentication material are excluded from source packages.

The visitor database records public IP addresses and approximate device/location information for the administrator. Local IPs are suppressed. Review the site's privacy notice and retention settings for your deployment. Never attach a populated database, media, environment file, or credential-bearing log to a public issue.

## Reporting a vulnerability

Contact the maintainer privately through the GitHub account linked by the repository before disclosing credential bypasses or private data exposure. Use GitHub private vulnerability reporting if available. Public issues are suitable for ordinary bugs with sanitized reproduction steps. Do not include passwords, session cookies, tokens, or personal media.
