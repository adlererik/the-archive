import { access, copyFile, mkdir, readFile, stat } from "fs/promises";
import path from "path";
import { createHash } from "crypto";
import { PrismaClient, MediaType } from "@prisma/client";
import { generateThumbnail } from "../lib/thumbnails";
import { prepareVideo } from "../lib/video";

const prisma = new PrismaClient({ datasourceUrl: "file:" + path.resolve("prisma/dev.db") });
type ExportMedia = { uri?: unknown; creation_timestamp?: unknown; title?: unknown };
type ExportPost = { title?: unknown; creation_timestamp?: unknown; media?: unknown };
const root = path.resolve(process.env.INSTAGRAM_EXPORT_DIR || "work/instagram-export");
const uploadDirectory = path.resolve("public/uploads");
const supported = new Set([".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov"]);

function repairText(value: unknown) {
  if (typeof value !== "string") return "";
  let text = value;
  for (let pass = 0; pass < 3 && /[ÃÂâð]/.test(text); pass++) {
    if (Array.from(text).some((character) => character.codePointAt(0)! > 255)) break;
    const candidate = Buffer.from(text, "latin1").toString("utf8");
    if (candidate.includes("�") || candidate === text) break;
    text = candidate;
  }
  return text;
}

async function exists(file: string) { try { await access(file); return true; } catch { return false; } }

async function main() {
  const candidates = ["your_instagram_activity/media/posts_1.json", "your_instagram_activity/content/posts_1.json", "posts_1.json"];
  let jsonPath = "";
  for (const candidate of candidates) if (await exists(path.join(root, candidate))) { jsonPath = path.join(root, candidate); break; }
  if (!jsonPath) throw new Error("Instagram posts file was not found in " + root);
  const payload: unknown = JSON.parse(await readFile(jsonPath, "utf8"));
  if (!Array.isArray(payload)) throw new Error("The export must contain an array of posts");
  const latestFlag = process.argv.find(argument => argument.startsWith("--latest="));
  const latest = latestFlag ? Number(latestFlag.split("=")[1]) : null;
  if (latest !== null && (!Number.isInteger(latest) || latest < 1)) throw new Error("--latest must be a positive integer, for example --latest=5");
  const entries = Array.from(payload.entries());
  const timestamp = (raw: ExportPost) => Number(raw.creation_timestamp || (Array.isArray(raw.media) ? raw.media[0]?.creation_timestamp : 0));
  const selected = latest === null ? entries : entries.sort((a, b) => timestamp(b[1]) - timestamp(a[1])).slice(0, latest);
  await mkdir(uploadDirectory, { recursive: true });
  let imported = 0, existing = 0, missingFiles = 0, skipped = 0;
  for (const [postIndex, rawPost] of selected) {
    const post = rawPost as ExportPost;
    const media = Array.isArray(post.media) ? post.media as ExportMedia[] : [];
    const seconds = Number(post.creation_timestamp || media[0]?.creation_timestamp);
    if (!Number.isFinite(seconds) || !seconds) { skipped++; continue; }
    const takenAt = new Date(seconds * 1000);
    const caption = repairText(post.title || media.find((item) => item.title)?.title);
    const sourceId = "instagram-" + createHash("sha256").update(JSON.stringify({ seconds, uris: media.map((item) => item.uri) })).digest("hex").slice(0, 32);
    if (await prisma.post.findUnique({ where: { sourceId } })) { existing++; continue; }
    // Reconcile the initial import without replacing subsequent user edits.
    const firstUri = media[0]?.uri;
    const legacyName = typeof firstUri === "string" ? "instagram-" + postIndex + "-0-" + path.basename(firstUri) : "";
    const legacy = legacyName ? await prisma.mediaItem.findUnique({ where: { fileName: legacyName }, include: { post: true } }) : null;
    if (legacy) { await prisma.post.update({ where: { id: legacy.postId }, data: { sourceId, ...(legacy.post.caption === String(post.title || "") ? { caption } : {}) } }); existing++; continue; }

    // A partial carousel would silently lose memories. Validate every item first.
    for (const item of media) {
      if (typeof item.uri !== "string") throw new Error("Post has a missing media path");
      const source = path.resolve(root, item.uri);
      if (!source.startsWith(path.resolve(root, "media") + path.sep) || !supported.has(path.extname(source).toLowerCase()) || !await exists(source) || !(await stat(source)).size) throw new Error("Post media is missing or unsupported: " + item.uri);
    }
    const copied: { fileName: string; originalName: string; mediaType: MediaType; position: number; thumbnail: string | null; playbackFile: string | null }[] = [];
    for (const [position, item] of media.entries()) {
      if (typeof item.uri !== "string") continue;
      const source = path.resolve(root, item.uri);
      if (!source.startsWith(path.resolve(root, "media") + path.sep)) continue;
      const extension = path.extname(source).toLowerCase();
      if (!supported.has(extension)) continue;
      if (!await exists(source) || !(await stat(source)).size) { missingFiles++; continue; }
      const fileName = "instagram-" + postIndex + "-" + position + "-" + path.basename(source);
      if (!await exists(path.join(uploadDirectory, fileName))) await copyFile(source, path.join(uploadDirectory, fileName));
      const type = extension === ".mp4" || extension === ".mov" ? MediaType.VIDEO : MediaType.IMAGE;
      const thumbnail = await generateThumbnail(fileName);
      const playbackFile = type === MediaType.VIDEO ? await prepareVideo(fileName) : null;
      copied.push({ fileName, originalName: path.basename(source), mediaType: type, position, thumbnail, playbackFile });
    }
    if (!copied.length) { skipped++; continue; }
    await prisma.post.create({ data: { sourceId, caption, takenAt, mediaItems: { create: copied } } });
    imported++;
  }
  console.log(JSON.stringify({ imported, existing, skipped, missingFiles, totalPosts: await prisma.post.count(), mediaItems: await prisma.mediaItem.count() }));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
