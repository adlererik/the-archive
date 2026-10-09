import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
const mime = { ".mp4": "video/mp4", ".mov": "video/quicktime", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

// Stream directly from disk, including media uploaded after the server started.
export async function serveMedia(req, res) {
  if (!req.url?.startsWith("/uploads/")) return false;
  if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405, { Allow: "GET, HEAD" }); res.end(); return true; }
  let name;
  try { name = decodeURIComponent(req.url.split("?")[0].slice(9)); } catch { res.writeHead(400); res.end(); return true; }
  if (!name || name !== path.basename(name) || name.includes("\\") || name.startsWith(".") || name.includes(".partial.")) { res.writeHead(404); res.end(); return true; }
  const filename = path.join(process.cwd(), "public/uploads", name);
  const file = await stat(filename).catch(() => null);
  if (!file?.isFile()) { res.writeHead(404); res.end(); return true; }
  const tag = '"' + file.size.toString(16) + "-" + Math.floor(file.mtimeMs).toString(16) + '"';
  res.setHeader("Content-Type", mime[path.extname(name).toLowerCase()] || "application/octet-stream");
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.setHeader("ETag", tag);
  res.setHeader("Last-Modified", file.mtime.toUTCString());
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.headers["if-none-match"] === tag && !req.headers.range) { res.writeHead(304); res.end(); return true; }
  let start = 0, end = file.size - 1, status = 200;
  const range = req.headers.range;
  if (range && (!req.headers["if-range"] || req.headers["if-range"] === tag || req.headers["if-range"] === file.mtime.toUTCString())) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) { res.writeHead(416, { "Content-Range": "bytes */" + file.size }); res.end(); return true; }
    start = match[1] ? Number(match[1]) : Math.max(0, file.size - Number(match[2]));
    end = match[1] && match[2] ? Math.min(Number(match[2]), file.size - 1) : file.size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= file.size) { res.writeHead(416, { "Content-Range": "bytes */" + file.size }); res.end(); return true; }
    status = 206;
    res.setHeader("Content-Range", "bytes " + start + "-" + end + "/" + file.size);
  }
  res.setHeader("Content-Length", Math.max(0, end - start + 1));
  res.writeHead(status);
  if (req.method === "HEAD" || !file.size) { res.end(); return true; }
  const stream = createReadStream(filename, { start, end });
  stream.on("error", () => res.destroy());
  res.on("close", () => stream.destroy());
  stream.pipe(res);
  return true;
}
