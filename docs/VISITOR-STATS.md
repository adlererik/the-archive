# Visitor statistics and persistent history

By Erik Adler · v1.3.0.

## Find the statistics

Sign in, then open the **cogwheel at the far right of the gallery icon row → Visitor stats**. Visitors who are signed out cannot see this menu or the recorded IP addresses. The square-plus remains the media uploader.

Statistics show total outside visits, distinct visitor identities, approximate cities, collection/media/heart counts, and device breakdowns. History rows show visit time, connection IP, OS icon, device/browser, country flag/name, approximate city/region, language, and referring website information. Older history is paginated in groups of 50.

## Outside visitors only

The server excludes private/local addresses, including LAN and loopback connections. Once a valid CMS admin session identifies your browser and public IP, those identities are remembered privately in `.runtime/visitor-exclusions.json`. Recognized owner visits remain excluded after logout, and matching older rows are hidden from statistics without being deleted.

Sign in on each browser or changed network address you use. Until identified, a new owner browser/address can be counted as an outside visitor. Other people sharing an excluded public IP can also be excluded; a VPN, mobile network, router, or proxy can share addresses between people. Statistics cannot guarantee a unique person per IP or cookie. Clearing cookies changes a browser's visitor identity.

Behind a correctly configured loopback Cloudflare Tunnel, the server uses the original client-IP header. Direct LAN requests use the socket address. Do not enable proxy trust for arbitrary public clients. Location lookup uses a local GeoIP database, with no external IP-lookup request; approximate cities/countries and browser-reported OS/device labels can be inaccurate or unavailable.

## Keep or delete history

There is **no automatic expiration or scheduled deletion**. Records stay in local SQLite until you manually remove them.

- Use a row's trash button to delete that visit, then confirm.
- Use **Delete all visit history** to remove all stored visits, then confirm.

Deleting visits leaves posts, media, hearts, settings, and browser Favorites intact. Old records deleted by previous versions cannot be recovered by this update. A new visit can still be recorded after deletion. Private owner-exclusion settings are separate from history and remain in effect.

Back up SQLite if retaining history matters to you. Never publish visitor databases or private exclusion files. Update the public visitor information notice for your installation and how you use the records. See [Administration](ADMIN.md), [Security](../SECURITY.md), and [backup instructions](OPERATIONS.md#backups-and-migration).
