import { copyFile, mkdir, readFile, rename, stat, writeFile, unlink } from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { PrismaClient, MediaType } from "@prisma/client";
import { generateThumbnail } from "../lib/thumbnails";
import { prepareVideo } from "../lib/video";
const run = promisify(execFile);
const prisma = new PrismaClient({ datasourceUrl: "file:" + path.resolve("prisma/dev.db") });
const directory = path.resolve("public/uploads");
const staging = path.resolve("work/instagram-new-posts/media");
type Slide = { kind: "IMAGE" | "VIDEO"; url?: string; path?: string; streams?: string[]; expectedDuration?: number; style?: string; width?: number };
type LivePost = { url: string; publishedAt: string; caption: string; slides: Slide[] };
async function exists(file: string) { try { return (await stat(file)).size > 0; } catch { return false; } }
function mediaUrl(raw: string) {
  const url = new URL(raw);
  if (url.protocol !== "https:" || !(url.hostname.endsWith(".fbcdn.net") || url.hostname.endsWith(".cdninstagram.com"))) throw new Error("Unexpected Instagram media host");
  return url;
}
async function download(raw: string, file: string) {
  if (await exists(file)) return;
  const url = mediaUrl(raw);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(45000), headers: { "User-Agent": "Mozilla/5.0" } });
      if (!response.ok || response.status === 206) throw new Error("Media download returned " + response.status);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!bytes.length) throw new Error("Empty media download");
      await writeFile(file + ".partial", bytes);
      await rename(file + ".partial", file);
      return;
    } catch (error) { if (attempt === 2) throw error; }
  }
}
async function probe(file: string) {
  const result = await run("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,width,height,duration:format=duration", "-of", "json", file], { timeout: 30000, maxBuffer: 500000 });
  return JSON.parse(result.stdout) as { streams: { codec_type: string; width?: number; height?: number; duration?: string }[]; format: { duration?: string } };
}
async function videoOriginal(slide: Slide, file: string) {
  if (!slide.streams?.length || !Number.isFinite(slide.expectedDuration)) throw new Error("Video stream metadata is incomplete");
  const streams = slide.streams.map(raw => { const url = mediaUrl(raw); const info = JSON.parse(Buffer.from(url.searchParams.get("efg") || "", "base64").toString()); return { raw, info }; });
  const video = streams.filter(s => !s.info.vencode_tag.includes("audio")).sort((a, b) => b.info.bitrate - a.info.bitrate)[0];
  const audio = streams.filter(s => s.info.vencode_tag.includes("audio")).sort((a, b) => b.info.bitrate - a.info.bitrate)[0];
  if (!video) throw new Error("Missing video track");
  if (await exists(file)) {
    try {
      const existing = await probe(file);
      if (existing.streams.some(s => s.codec_type === "video") && (!audio || existing.streams.some(s => s.codec_type === "audio")) && Math.abs(Number(existing.format.duration) - slide.expectedDuration!) <= 1.5) return;
    } catch { /* Retry a failed or interrupted media preparation. */ }
    await unlink(file);
  }
  const temporaryVideo = path.join(staging, path.basename(file) + ".video.mp4");
  await download(video.raw, temporaryVideo);
  const temporaryAudio = path.join(staging, path.basename(file) + ".audio.mp4");
  if (audio) await download(audio.raw, temporaryAudio);
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", temporaryVideo, ...(audio ? ["-i", temporaryAudio] : []), "-map", "0:v:0", ...(audio ? ["-map", "1:a:0"] : ["-map", "0:a:0?"]), "-c", "copy", "-movflags", "+faststart", file], { timeout: 120000, maxBuffer: 1000000 });
  const result = await probe(file);
  const duration = Number(result.format.duration);
  if (!result.streams.some(s => s.codec_type === "video") || (audio && !result.streams.some(s => s.codec_type === "audio")) || !Number.isFinite(duration) || Math.abs(duration - slide.expectedDuration!) > 1.5) throw new Error("Incomplete video/audio download: " + path.basename(file));
}
async function main() {
  const input: LivePost[] = JSON.parse(await readFile(path.resolve(process.argv[2] || "work/instagram-new-posts/collected-posts.json"), "utf8"));
  if (!Array.isArray(input) || !input.length) throw new Error("A nonempty list of complete posts is required");
  const posts = input.map(post => {
    const url = new URL(post.url);
    const shortcode = /^\/(?:[A-Za-z0-9_.]+\/)?(?:p|reel)\/([A-Za-z0-9_-]+)\/?$/.exec(url.pathname)?.[1];
    if (url.hostname !== "www.instagram.com" || !shortcode || !post.caption || !post.slides.length || !post.publishedAt?.endsWith("Z") || Number.isNaN(Date.parse(post.publishedAt))) throw new Error("Invalid post metadata");
    for (const [position, slide] of post.slides.entries()) {
      if (slide.style && slide.width) { const offset = Number(/translateX\((\d+)px\)/.exec(slide.style)?.[1]); if (!Number.isFinite(offset) || Math.abs(offset / slide.width - position) > .01) throw new Error("Carousel order mismatch at " + shortcode + " item " + position); }
    }
    return { ...post, shortcode, sourceId: "instagram-live-" + shortcode };
  });
  if (new Set(posts.map(p => p.sourceId)).size !== posts.length) throw new Error("Duplicate source posts");
  await mkdir(directory, { recursive: true }); await mkdir(staging, { recursive: true });
  const records: { sourceId: string; caption: string; takenAt: Date; mediaItems: { create: { fileName: string; originalName: string; mediaType: MediaType; position: number; thumbnail: string; playbackFile: string | null }[] } }[] = [];
  for (const post of posts) {
    if (await prisma.post.findUnique({ where: { sourceId: post.sourceId } })) { console.log("Already imported:", post.shortcode); continue; }
    const created = [];
    for (const [position, slide] of post.slides.entries()) {
      const extension = slide.kind === "VIDEO" ? ".mp4" : slide.url ? path.extname(mediaUrl(slide.url).pathname).toLowerCase() : path.extname(slide.path || "").toLowerCase();
      if (![".jpg", ".jpeg", ".webp", ".png", ".mp4"].includes(extension)) throw new Error("Unsupported downloaded media");
      const fileName = "instagram-live-" + post.shortcode + "-" + String(position).padStart(2, "0") + extension;
      const destination = path.join(directory, fileName);
      if (slide.kind === "VIDEO") await videoOriginal(slide, destination);
      else if (slide.path && !await exists(destination)) await copyFile(slide.path, destination);
      else if (slide.url) await download(slide.url, destination);
      if (!await exists(destination)) throw new Error("Missing media file");
      const thumbnail = await generateThumbnail(fileName);
      if (!thumbnail) throw new Error("Unreadable photo/video: " + fileName);
      const playbackFile = slide.kind === "VIDEO" ? await prepareVideo(fileName, { preset: "veryfast", timeout: 1800000 }) : null;
      if (playbackFile) { const result = await probe(path.join(directory, playbackFile)); if (Math.abs(Number(result.format.duration) - slide.expectedDuration!) > 1.5) throw new Error("Playback duration mismatch"); }
      created.push({ fileName, originalName: slide.kind === "VIDEO" ? fileName : slide.url ? path.basename(new URL(slide.url).pathname) : path.basename(slide.path!), mediaType: slide.kind === "VIDEO" ? MediaType.VIDEO : MediaType.IMAGE, position, thumbnail, playbackFile });
      console.log("Prepared", post.shortcode, position + 1, "of", post.slides.length, slide.kind);
    }
    records.push({ sourceId: post.sourceId, caption: post.caption, takenAt: new Date(post.publishedAt), mediaItems: { create: created } });
  }
  // Insert only after all supplied carousels have complete, playable media.
  await prisma.$transaction(records.map(data => prisma.post.create({ data })));
  console.log(JSON.stringify({ imported: records.length, mediaAdded: records.reduce((sum, p) => sum + p.mediaItems.create.length, 0), totalPosts: await prisma.post.count(), totalMedia: await prisma.mediaItem.count() }));
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
