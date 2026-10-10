import type { ArchiveMedia, PostSoundtrack } from "./archive";
export type FavoriteMedia = ArchiveMedia & { postId: string; caption: string; takenAt: string; soundtrack: PostSoundtrack | null };
