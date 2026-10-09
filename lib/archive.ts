import { MediaType, Post } from "@prisma/client";

export type ArchiveMedia = {
  id: string;
  fileName: string;
  originalName: string;
  thumbnail: string | null;
  playbackFile: string | null;
  mediaType: MediaType;
  position: number;
};

export type ArchivePost = {
  id: string;
  caption: string;
  takenAt: string;
  mediaItems: ArchiveMedia[];
};

export function toArchivePost(post: Post & { mediaItems: ArchiveMedia[] }): ArchivePost {
  return {
    id: post.id,
    caption: post.caption,
    takenAt: post.takenAt.toISOString(),
    mediaItems: post.mediaItems,
  };
}

export function mediaUrl(fileName: string) {
  return "/uploads/" + encodeURIComponent(fileName);
}
