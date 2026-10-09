# Source changes and GitHub

By Erik Adler.

The public source repository is [adlererik/the-archive](https://github.com/adlererik/the-archive). Commit attribution is configured locally as Erik Adler using the GitHub account's public noreply address.

For each substantial change, update the documentation and development notes, build and verify the application, review the staged files, then commit and push:

```bash
./archive stop
./archive build
./archive start
# In another terminal, after verification:
git status --short
git add <source-files-and-documentation>
git diff --cached --stat
git diff --cached --name-only
git commit -m "Describe the change"
git push origin main
```

Never force-add ignored files. Do not publish media, SQLite databases, visitor records, actual environment files, local screenshots, or Instagram export manifests. The committed `.env.example` contains placeholders only. Keep private backups separately when migrating; Git contains the application source and documentation.

GitHub browser sign-in and command-line push authorization are separate. This machine uses an authorized GitHub CLI credential helper. On another machine, install GitHub CLI from its official source, use `gh auth login`, then `gh auth setup-git`. Review its permissions yourself. Do not put tokens in source files, remote URLs, or commit messages.

See [verification notes](VERIFICATION.md) and [operations](OPERATIONS.md) before deploying or updating a running installation.

## Public releases

Create annotated release tags after the source build and privacy audit. Audit all reachable Git blobs, not just the current checkout. Create ZIP and tarball assets using `git archive <tag>`; never package the workspace directly. Ship a lockfile, schema, empty uploads directory, license, and setup documentation. Exclude all private databases, media, environment files, credentials, and local runtime state. Generate SHA-256 checksums for source assets, inspect the resulting archives, then publish the GitHub release with its release notes. A release must be downloadable without repository authentication.
