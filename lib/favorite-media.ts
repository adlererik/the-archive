import type { ArchiveMedia } from "./archive";
export type FavoriteMedia = ArchiveMedia & { postId: string; caption: string; takenAt: string };
