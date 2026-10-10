import { execFile } from "child_process";
import { rename, unlink } from "fs/promises";
import path from "path";
import { promisify } from "util";
const run = promisify(execFile);
export async function prepareSoundtrack(fileName: string) {
  const directory = path.join(process.cwd(), "public/uploads");
  const source = path.join(directory, path.basename(fileName));
  const name = path.basename(fileName) + ".soundtrack.m4a";
  const temporary = path.join(directory, name + ".partial.m4a");
  try {
    const probe = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type", "-of", "json", source], { timeout: 30000 });
    const info = JSON.parse(probe.stdout);
    const duration = Number(info.format?.duration);
    if (!info.streams?.some((s: { codec_type: string }) => s.codec_type === "audio") || !Number.isFinite(duration) || duration <= 0 || duration > 7200) throw new Error("Choose a readable audio track lasting up to two hours.");
    await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", source, "-map", "0:a:0", "-vn", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", temporary], { timeout: 300000, maxBuffer: 1000000 });
    await rename(temporary, path.join(directory, name));
    return { fileName: name, duration };
  } catch (error) { await unlink(temporary).catch(() => undefined); throw error; }
}
export function soundtrackSettings(value: unknown, duration: number) {
  const settings = value as { start?: unknown; end?: unknown; volume?: unknown; loop?: unknown; muteVideo?: unknown } | null;
  const start = Number(settings?.start ?? 0); const end = settings?.end == null ? duration : Number(settings.end); const volume = Number(settings?.volume ?? .65);
  if (![start, end, volume].every(Number.isFinite) || start < 0 || end > duration + .1 || end - start < .1 || volume < 0 || volume > 1) throw new Error("Set a valid soundtrack trim and volume.");
  return { soundtrackStart: start, soundtrackEnd: Math.min(end, duration), soundtrackVolume: volume, soundtrackLoop: settings?.loop !== false, soundtrackMuteVideo: settings?.muteVideo !== false };
}
