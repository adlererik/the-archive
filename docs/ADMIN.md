# Administration and login

By Erik Adler.

Open `/admin/login` and enter your username and password. On a new database, the environment variables `ADMIN_USERNAME` and `ADMIN_PASSWORD` establish the initial account. The database then stores the username and a salted password hash. Changing `.env.local` does not replace an existing account.

Use Admin → Login settings to change the username or password with the current password. Old sessions are revoked after a change. If you lose access, set the desired `ADMIN_USERNAME` and `ADMIN_PASSWORD` in private `.env.local`, then run `./archive reset-login` locally from the project directory. This replaces the stored login and revokes existing sessions. Keep real passwords and session secrets in `.env.local`; never commit that file.

Admin sections include media uploads and backdated carousels, visitor statistics with approximate cities, editable header text, account settings, and this documentation. In-place wall editing can change captions and timestamps, or delete a whole post and its local media. Date changes automatically change the post's position in the chronological wall.

Visitor IPs are not displayed. Private/local IPs are discarded; city estimates are available only for resolvable public addresses. Clear visitor information resets visit records without removing posts, media, favorites saved in readers' browsers, or hearts. Statistics remain local and are automatically pruned after 90 days.

Use HTTPS with secure cookies before exposing the archive on a server. Source control and backups have different purposes: Git contains application code; a private backup contains the database, uploads, and environment configuration needed to recover your archive.
