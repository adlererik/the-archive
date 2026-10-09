import { execFile } from "child_process";
import { access } from "fs/promises";
import path from "path";
import { promisify } from "util";

const run = promisify(execFile);

export async function generateThumbnail(fileName: string) {
  const directory = path.join(process.cwd(), "public/uploads");
  const name = path.basename(fileName) + ".thumb.jpg";
  const destination = path.join(directory, name);
  try { await access(destination); return name; } catch { /* Generate a missing preview. */ }
  try {
    await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-threads", "1", "-i", path.join(directory, path.basename(fileName)), "-frames:v", "1", "-vf", "scale=640:640:force_original_aspect_ratio=decrease", "-q:v", "3", "-threads", "1", destination], { timeout: 30_000, maxBuffer: 500_000 });
    return name;
  } catch { return null; }
}
