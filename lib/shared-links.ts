import "server-only";
import { createHmac } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { cache } from "react";
import { prisma } from "./prisma";
import { sessionSecret } from "./session-secret";
import { toArchivePost } from "./archive";
import type { FavoriteMedia } from "./favorite-media";

export type SharedSelection = { kind: "media" | "presentation"; ids: string[]; seconds: number; loop: boolean };
const directory = () => path.join(process.cwd(), ".runtime", "shared-links");
export function validSelection(value: unknown): value is SharedSelection {
  if (!value || typeof value !== "object") return false;
  const data = value as SharedSelection;
  return ["media", "presentation"].includes(data.kind) && Array.isArray(data.ids) && data.ids.length > 0 && data.ids.length <= 1000 && (data.kind !== "media" || data.ids.length === 1) && data.ids.every(id => typeof id === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(id)) && [3, 6, 10, 15, 30].includes(data.seconds) && typeof data.loop === "boolean";
}
export async function selectedMedia(ids: string[]): Promise<FavoriteMedia[]> {
  const records = await prisma.mediaItem.findMany({ where: { id: { in: ids } }, include: { post: true } });
  const lookup = new Map(records.map(record => [record.id, record]));
  return ids.flatMap(id => {
    const record = lookup.get(id);
    return record ? [{ id: record.id, fileName: record.fileName, originalName: record.originalName, thumbnail: record.thumbnail, playbackFile: record.playbackFile, mediaType: record.mediaType, position: record.position, hasSoundtrack: Boolean(record.post.soundtrackFile), revision: record.post.updatedAt.toISOString(), postId: record.postId, caption: record.post.caption, takenAt: record.post.takenAt.toISOString(), soundtrack: toArchivePost({ ...record.post, mediaItems: [] }).soundtrack }] : [];
  });
}
export async function saveSharedSelection(selection: SharedSelection) {
  const serialized = JSON.stringify(selection);
  const token = createHmac("sha256", sessionSecret()).update("shared-selection:" + serialized).digest("base64url").slice(0, 16);
  await mkdir(directory(), { recursive: true, mode: 0o700 });
  try { await writeFile(path.join(directory(), token + ".json"), serialized, { flag: "wx", mode: 0o600 }); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST" || await readFile(path.join(directory(), token + ".json"), "utf8") !== serialized) throw error;
  }
  return "/s/" + token;
}
export const loadSharedSelection = cache(async (token: string) => {
  if (!/^[a-zA-Z0-9_-]{16}$/.test(token)) return null;
  let data: unknown;
  try { data = JSON.parse(await readFile(path.join(directory(), token + ".json"), "utf8")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT" || error instanceof SyntaxError) return null; throw error; }
  if (!validSelection(data)) return null;
  const items = await selectedMedia(data.ids);
  return items.length ? { ...data, items } : null;
});
