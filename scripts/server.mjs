import http from "node:http";
import { isIP } from "node:net";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import next from "next";
import { isPublicAddress, visitorLocation } from "./visitor-location.mjs";
import { hasAdminSession, readVisitorExclusions, rememberOwner } from "./visitor-exclusions.mjs";
import { serveMedia } from "./serve-media.mjs";

const port = Number(process.env.ARCHIVE_PORT || 3000);
const hostname = process.env.ARCHIVE_HOST || "0.0.0.0";
const app = next({ dev: process.env.ARCHIVE_DEV === "true", hostname, port });
await app.prepare();
// Next loads .env.local during prepare, including on a fresh clone.
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32 || ["replace-with-a-long-random-secret", "archive-local-session-change-this-before-public-exposure"].includes(sessionSecret)) throw new Error("Configure your own SESSION_SECRET in .env.local. Run ./archive setup for a new installation.");
const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();
const sign = value => createHmac("sha256", sessionSecret).update("visitor:" + value).digest("base64url");
const handle = app.getRequestHandler();
const server = http.createServer(async (req, res) => {
  const peer = (req.socket.remoteAddress || "").replace(/^::ffff:/, "");
  let ip = peer || "Unknown";
  // Trust forwarded IPs only when explicitly enabled behind a local reverse proxy.
  if (process.env.TRUST_PROXY === "true" && (peer === "127.0.0.1" || peer === "::1")) {
    const candidates = [req.headers["cf-connecting-ipv6"], req.headers["cf-connecting-ip"], String(req.headers["x-forwarded-for"] || "").split(",").at(-1)];
    for (const candidate of candidates) {
      const forwarded = typeof candidate === "string" ? candidate.trim().replace(/^::ffff:/i, "") : "";
      if (isIP(forwarded)) { ip = forwarded; break; }
    }
  }
  const pathname = (req.url || "").split("?")[0];
  if (req.method === "GET" && (["/", "/favorites", "/privacy", "/admin", "/admin/settings", "/admin/login"].includes(pathname) || /^\/s\/[A-Za-z0-9_-]{16}$/.test(pathname))) {
    const fullVisit = !req.headers.rsc && !req.headers["next-router-prefetch"];
    const raw = (req.headers.cookie || "").split(";").map(c => c.trim()).find(c => c.startsWith("archive_visitor="))?.slice(16) || "";
    const [id, signature] = raw.split(".");
    const expected = id ? sign(id) : "";
    const valid = Boolean(id && signature && Buffer.byteLength(signature) === Buffer.byteLength(expected) && timingSafeEqual(Buffer.from(signature), Buffer.from(expected)));
    const token = valid ? raw : (() => { const value = randomUUID(); return value + "." + sign(value); })();
    if (!valid && (fullVisit || (req.headers.cookie || "").includes("archive_admin="))) res.setHeader("Set-Cookie", "archive_visitor=" + token + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000" + (process.env.SESSION_COOKIE_SECURE === "true" ? "; Secure" : ""));
    const ua = String(req.headers["user-agent"] || "").slice(0, 2048);
    const os = /Android/i.test(ua) ? "Android" : /iPhone|iPad|iPod/i.test(ua) ? "iOS / iPadOS" : /Windows/i.test(ua) ? "Windows" : /Macintosh|Mac OS/i.test(ua) ? "macOS" : /Linux/i.test(ua) ? "Linux" : "Unknown";
    const browser = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\/|CriOS\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Other / unknown";
    const device = /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) ? "Tablet" : /Mobile|iPhone|iPod/i.test(ua) ? "Mobile" : /Windows|Macintosh|Linux/i.test(ua) ? "Desktop" : "Other / unknown";
    const visitorKey = sign(token);
    const adminToken = (req.headers.cookie || "").split(";").map(value => value.trim()).find(value => value.startsWith("archive_admin="))?.slice(14);
    try {
      const owner = await hasAdminSession(adminToken, sessionSecret, prisma);
      if (owner) await rememberOwner(ip, visitorKey);
      const excluded = fullVisit ? await readVisitorExclusions() : { ips: [], visitorKeys: [] };
      if (fullVisit && isPublicAddress(ip) && !owner && !excluded.ips.includes(ip) && !excluded.visitorKeys.includes(visitorKey)) {
        void prisma.visit.create({ data: { visitorKey, ip, ...visitorLocation(ip), os, browser, device, userAgent: ua, language: String(req.headers["accept-language"] || "").slice(0, 120), referrer: (() => { try { return new URL(String(req.headers.referer)).hostname.replace(/^\[|\]$/g, ""); } catch { return "Direct"; } })() } }).catch(error => console.error("Visit recording failed:", error.message));
      }
    } catch (error) { console.error("Visitor filtering failed:", error.message); }
  }
  try { if (!await serveMedia(req, res)) await handle(req, res); } catch (error) { console.error(error); if (!res.headersSent) res.writeHead(500); res.end("Unable to serve the archive"); }
});
server.listen(port, hostname, () => console.log("The Archive listening at http://" + hostname + ":" + port));
let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  server.close(async () => { await prisma.$disconnect(); process.exit(0); });
  server.closeIdleConnections();
  setTimeout(() => process.exit(0), 7000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
