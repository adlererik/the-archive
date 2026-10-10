import { MediaType, Post } from "@prisma/client";

export type ArchiveMedia = {
  id: string;
  fileName: string;
  originalName: string;
  thumbnail: string | null;
  playbackFile: string | null;
  mediaType: MediaType;
  position: number;
  hasSoundtrack?: boolean;
  revision?: string;
};

export type PostSoundtrack = { fileName: string; name: string; duration: number; start: number; end: number; volume: number; loop: boolean; muteVideo: boolean };

export type ArchivePost = {
  id: string;
  caption: string;
  takenAt: string;
  updatedAt: string;
  soundtrack: PostSoundtrack | null;
  mediaItems: ArchiveMedia[];
};

export function toArchivePost(post: Post & { mediaItems: ArchiveMedia[] }): ArchivePost {
  return {
    id: post.id,
    caption: post.caption,
    takenAt: post.takenAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    soundtrack: post.soundtrackFile ? { fileName: post.soundtrackFile, name: post.soundtrackName || "Soundtrack", duration: post.soundtrackDuration, start: post.soundtrackStart, end: post.soundtrackEnd ?? post.soundtrackDuration, volume: post.soundtrackVolume, loop: post.soundtrackLoop, muteVideo: post.soundtrackMuteVideo } : null,
    mediaItems: post.mediaItems.map(item => ({ ...item, hasSoundtrack: Boolean(post.soundtrackFile), revision: post.updatedAt.toISOString() })),
  };
}

export function mediaUrl(fileName: string) {
  return "/uploads/" + encodeURIComponent(fileName);
}
