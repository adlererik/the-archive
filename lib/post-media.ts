import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { MediaType } from "@prisma/client";
import { generateThumbnail } from "./thumbnails";
import { prepareVideo } from "./video";
import { prepareSoundtrack } from "./soundtrack";

export const mediaExtensions = new Set([".mp4", ".mov", ".jpg", ".jpeg", ".png", ".webp"]);
export const audioExtensions = new Set([".mp3", ".m4a", ".aac", ".wav", ".ogg", ".flac"]);
export function uploadPath(name: string) { return path.join(process.cwd(), "public/uploads", path.basename(name)); }
export async function removeFiles(names: (string | null | undefined)[]) {
  await Promise.all([...new Set(names.filter((name): name is string => Boolean(name)))].map(name => unlink(uploadPath(name)).catch(() => undefined)));
}
export function validateFiles(files: File[], audio?: File | null) {
  if (files.length > 100) throw new Error("Add up to 100 items at a time.");
  if (files.some(file => !mediaExtensions.has(path.extname(file.name).toLowerCase()))) throw new Error("Use MP4, MOV, JPG, JPEG, PNG, or WebP media.");
  if (files.some(file => file.size > 500 * 1024 * 1024)) throw new Error("Each image or video must be under 500 MB.");
  if (audio && (!audioExtensions.has(path.extname(audio.name).toLowerCase()) || audio.size > 100 * 1024 * 1024)) throw new Error("Use an MP3, M4A, AAC, WAV, OGG, or FLAC soundtrack under 100 MB.");
}
// Erik Adler: retain a cleanup ledger until the database transaction has committed.
export async function storeMedia(file: File, position: number, ledger: string[]) {
  await mkdir(path.dirname(uploadPath("file")), { recursive: true });
  const fileName = randomUUID() + path.extname(file.name).toLowerCase();
  ledger.push(fileName);
  await writeFile(uploadPath(fileName), Buffer.from(await file.arrayBuffer()));
  const mediaType = /\.(mp4|mov)$/i.test(file.name) ? MediaType.VIDEO : MediaType.IMAGE;
  const thumbnail = await generateThumbnail(fileName); if (thumbnail) ledger.push(thumbnail);
  const playbackFile = mediaType === MediaType.VIDEO ? await prepareVideo(fileName) : null; if (playbackFile) ledger.push(playbackFile);
  return { fileName, originalName: path.basename(file.name), mediaType, position, thumbnail, playbackFile };
}
export async function storeSoundtrack(file: File, ledger: string[]) {
  await mkdir(path.dirname(uploadPath("file")), { recursive: true });
  const original = randomUUID() + path.extname(file.name).toLowerCase(); ledger.push(original);
  await writeFile(uploadPath(original), Buffer.from(await file.arrayBuffer()));
  const prepared = await prepareSoundtrack(original); ledger.push(prepared.fileName);
  // Only the compatible audio copy is retained; never rely on a browser-specific codec.
  await removeFiles([original]);
  return { soundtrackFile: prepared.fileName, soundtrackName: path.basename(file.name), soundtrackDuration: prepared.duration };
}
