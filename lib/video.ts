import { execFile } from "child_process";
import { access, rename, unlink } from "fs/promises";
import path from "path";
import { promisify } from "util";
const run = promisify(execFile);

// Preserve originals; serve an MP4 with H.264, AAC-LC, and its index at the front.
export async function prepareVideo(fileName: string, options: { preset?: "fast" | "veryfast"; timeout?: number } = {}): Promise<string> {
  const directory = path.join(process.cwd(), "public/uploads");
  const name = path.basename(fileName) + ".playback.mp4";
  const destination = path.join(directory, name);
  try { await access(destination); return name; } catch { /* Prepare a missing playback copy. */ }
  const temporary = destination + ".partial.mp4";
  try {
    const probe = await run("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,codec_name,pix_fmt,level", "-of", "json", path.join(directory, path.basename(fileName))], { timeout: 30000, maxBuffer: 500000 });
    const streams = JSON.parse(probe.stdout).streams as { codec_type: string; codec_name: string; pix_fmt?: string; level?: number }[];
    const video = streams.find(s => s.codec_type === "video");
    if (!video) throw new Error("The uploaded file has no readable video track.");
    const copyVideo = video.codec_name === "h264" && video.pix_fmt === "yuv420p" && (video.level || 0) <= 42;
    await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-threads", "2", "-i", path.join(directory, path.basename(fileName)), "-map", "0:v:0", "-map", "0:a:0?", ...(copyVideo ? ["-c:v", "copy"] : ["-c:v", "libx264", "-preset", options.preset || "fast", "-crf", "21", "-pix_fmt", "yuv420p", "-vf", "scale='min(1920,iw)':-2", "-profile:v", "main", "-level:v", "4.1"]), "-c:a", "aac", "-profile:a", "aac_low", "-b:a", "160k", "-ar", "48000", "-movflags", "+faststart", "-threads", "2", temporary], { timeout: options.timeout || 600000, maxBuffer: 1000000 });
    await rename(temporary, destination);
    return name;
  } catch (error) { await unlink(temporary).catch(() => undefined); throw error; }
}
