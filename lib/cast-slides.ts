import { execFile } from "child_process";
import { createHash } from "crypto";
import { mkdir, readdir, rename, stat, unlink } from "fs/promises";
import path from "path";
import { promisify } from "util";
import { prisma } from "./prisma";
const run = promisify(execFile);
export const slideDurations = [3, 6, 10, 15, 30];
const jobs = new Map<string, Promise<string>>();
let tail: Promise<unknown> = Promise.resolve();
const directory = () => path.join(process.cwd(), "work/cast-slides");
export function slidePath(id: string, seconds: number, revision = "") { return path.join(directory(), id + "-" + seconds + (revision ? "-" + revision : "") + ".mp4"); }
export async function prepareCastSlide(id: string, seconds: number) {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id) || !slideDurations.includes(seconds)) throw new Error("Invalid cast media");
  const record = await prisma.mediaItem.findUnique({ where: { id }, include: { post: true } });
  if (!record || (record.mediaType === "VIDEO" && !record.post.soundtrackFile)) throw new Error("Cast media not found");
  const revision = createHash("sha256").update(record.post.updatedAt.toISOString()).digest("hex").slice(0, 16);
  const destination = slidePath(id, seconds, revision);
  if ((await stat(destination).catch(() => null))?.size) return destination;
  const key = id + "-" + seconds + "-" + revision; const existing = jobs.get(key); if (existing) return existing;
  if (jobs.size >= 20) throw new Error("Media preparation is busy. Try again shortly.");
  const job = tail.catch(() => undefined).then(async () => {
    await mkdir(directory(), { recursive: true }); const temporary = destination + ".partial.mp4";
    const media = record; const track = record.post; const image = media.mediaType === "IMAGE";
    const file = (name: string) => path.join(process.cwd(), "public/uploads", path.basename(name));
    try {
      let duration = seconds; let originalAudio = false;
      if (!image) {
        const probe = JSON.parse((await run("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type", "-of", "json", file(media.playbackFile || media.fileName)], { timeout: 30000 })).stdout);
        duration = Number(probe.format?.duration); originalAudio = probe.streams?.some((stream: { codec_type: string }) => stream.codec_type === "audio");
        if (!Number.isFinite(duration) || duration <= 0) throw new Error("Invalid video duration");
      }
      const args = ["-hide_banner", "-loglevel", "error", "-y", ...(image ? ["-loop", "1", "-framerate", "1"] : []), "-i", file(media.playbackFile || media.fileName)];
      if (track.soundtrackFile) {
        args.push("-i", file(track.soundtrackFile));
        const end = track.soundtrackEnd ?? track.soundtrackDuration;
        const samples = Math.max(1, Math.round((end - track.soundtrackStart) * 48000));
        const music = `[1:a]atrim=start=${track.soundtrackStart}:end=${end},asetpts=PTS-STARTPTS,volume=${track.soundtrackVolume}${track.soundtrackLoop ? `,aloop=loop=-1:size=${samples}` : ""},apad[music]`;
        const mix = originalAudio && !track.soundtrackMuteVideo ? ";[0:a][music]amix=inputs=2:duration=longest:normalize=0[sound]" : "";
        args.push("-filter_complex", music + mix, "-map", "0:v:0", "-map", mix ? "[sound]" : "[music]", "-c:a", "aac", "-b:a", "192k", "-ar", "48000");
      } else args.push("-an");
      // Erik Adler: the receiver gets a single compatible MP4, with optional soundtrack baked in.
      args.push("-t", String(duration), ...(image ? ["-vf", "scale=1920:1080:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black,setsar=1", "-r", "1", "-c:v", "libx264", "-preset", "ultrafast", "-crf", "18", "-pix_fmt", "yuv420p", "-profile:v", "main", "-level:v", "4.1"] : ["-c:v", "copy"]), "-movflags", "+faststart", "-threads", "2", temporary);
      await run("ffmpeg", args, { timeout: image ? 120000 : 600000, maxBuffer: 1000000 });
      const current = await prisma.mediaItem.findUnique({ where: { id }, include: { post: true } });
      if (!current || current.post.updatedAt.valueOf() !== record.post.updatedAt.valueOf()) throw new Error("Memory changed during preparation");
      await rename(temporary, destination); return destination;
    } catch (error) { await unlink(temporary).catch(() => undefined); throw error; }
  });
  jobs.set(key, job); tail = job; void job.finally(() => jobs.delete(key)).catch(() => undefined); return job;
}
export async function removeCastSlides(id: string) {
  await Promise.allSettled([...jobs.entries()].filter(([key]) => key.startsWith(id + "-")).map(([, job]) => job));
  const files = await readdir(directory()).catch(() => []);
  await Promise.all(files.filter(name => name.startsWith(id + "-")).map(name => unlink(path.join(directory(), name)).catch(() => undefined)));
}
