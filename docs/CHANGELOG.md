# Development notes

By Erik Adler.

## October 9, 2026

- Established the source-only GitHub repository with private visibility and Erik Adler commit attribution.
- Added individual-media favorites, a saved list, manual ordering, and mixed photo/video presentations with image timing and repeat controls.
- Added carousel touch swipes and consistent keyboard/button navigation; advancing past the final item returns to the wall.
- Added media-only Google Cast controls and a receiver-side favorites queue. Photos use locally generated silent still-image clips; original files remain unchanged.
- Added CORS support and range streaming for TV media, cancellation of stale Cast loads, local audio handoff, and generated-clip cleanup after deletion.
- Added deployment, migration, boot startup, account, favorites, and Cast documentation that is available from the admin Info panel and included with the source repository.

Personal archive imports and their verification artifacts remain local. They are not included in Git.
