import { execFile } from "child_process";
import { mkdir, rename, stat, unlink } from "fs/promises";
import path from "path";
import { promisify } from "util";
import { prisma } from "./prisma";
const run = promisify(execFile);
export const slideDurations = [3, 6, 10, 15, 30];
const jobs = new Map<string, Promise<string>>();
let tail: Promise<unknown> = Promise.resolve();
export function slidePath(id: string, seconds: number) { return path.join(process.cwd(), "work/cast-slides", id + "-" + seconds + ".mp4"); }
export async function prepareCastSlide(id: string, seconds: number) {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id) || !slideDurations.includes(seconds)) throw new Error("Invalid photo slide");
  const destination = slidePath(id, seconds);
  if ((await stat(destination).catch(() => null))?.size) return destination;
  const key = id + "-" + seconds; const existing = jobs.get(key); if (existing) return existing;
  if (jobs.size >= 20) throw new Error("Photo preparation is busy. Try again shortly.");
  const job = tail.catch(() => undefined).then(async () => {
    const media = await prisma.mediaItem.findUnique({ where: { id } }); if (!media || media.mediaType !== "IMAGE") throw new Error("Photo not found");
    await mkdir(path.dirname(destination), { recursive: true }); const temporary = destination + ".partial.mp4";
    try {
      // Erik Adler: a silent still-image clip works with the standard Cast receiver,
      // including its native mixed photo/video queue, without a custom receiver app.
      await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-loop", "1", "-framerate", "1", "-i", path.join(process.cwd(), "public/uploads", path.basename(media.fileName)), "-t", String(seconds), "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black,setsar=1", "-r", "1", "-c:v", "libx264", "-preset", "ultrafast", "-crf", "18", "-pix_fmt", "yuv420p", "-profile:v", "main", "-level:v", "4.1", "-an", "-movflags", "+faststart", "-threads", "2", temporary], { timeout: 120000, maxBuffer: 1000000 });
      if (!await prisma.mediaItem.findUnique({ where: { id } })) throw new Error("Photo was removed");
      await rename(temporary, destination); return destination;
    } catch (error) { await unlink(temporary).catch(() => undefined); throw error; }
  });
  jobs.set(key, job); tail = job; void job.finally(() => jobs.delete(key)).catch(() => undefined); return job;
}
export async function removeCastSlides(id: string) {
  await Promise.allSettled([...jobs.entries()].filter(([key]) => key.startsWith(id + "-")).map(([, job]) => job));
  await Promise.all(slideDurations.map(seconds => unlink(slidePath(id, seconds)).catch(() => undefined)));
}
