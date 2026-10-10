import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { prepareCastSlide, slideDurations } from "@/lib/cast-slides";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS", "Access-Control-Allow-Headers": "Range", "Access-Control-Expose-Headers": "Content-Range, Content-Length, Accept-Ranges", "X-Content-Type-Options": "nosniff" };
export function OPTIONS() { return new NextResponse(null, { status: 204, headers: cors }); }
async function resolve(request: NextRequest, id: string) {
  const seconds = Number(request.nextUrl.searchParams.get("seconds") || "6");
  if (!slideDurations.includes(seconds) || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return { error: new NextResponse("Invalid photo slide", { status: 400, headers: cors }) };
  const media = await prisma.mediaItem.findUnique({ where: { id }, include: { post: true } });
  if (!media || (media.mediaType !== "IMAGE" && !media.post.soundtrackFile)) return { error: new NextResponse("Media not found", { status: 404, headers: cors }) };
  try { const filename = await prepareCastSlide(id, seconds); if (!await prisma.mediaItem.findUnique({ where: { id } })) return { error: new NextResponse("Media not found", { status: 404, headers: cors }) }; return { filename }; }
  catch { return { error: new NextResponse("Unable to prepare this media for casting. Try again shortly.", { status: 503, headers: { ...cors, "Retry-After": "5" } }) }; }
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await resolve(request, (await params).id); return result.error || NextResponse.json({ ready: true }, { headers: cors });
}
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await resolve(request, (await params).id); if (result.error) return result.error;
  const file = await stat(result.filename!); let start = 0; let end = file.size - 1; let status = 200;
  const headers: Record<string, string> = { ...cors, "Content-Type": "video/mp4", "Accept-Ranges": "bytes", "Cache-Control": "no-cache" };
  const range = request.headers.get("range");
  if (range) { const match = /^bytes=(\d*)-(\d*)$/.exec(range); if (!match || (!match[1] && !match[2])) return new NextResponse(null, { status: 416, headers: { ...headers, "Content-Range": "bytes */" + file.size } }); start = match[1] ? Number(match[1]) : Math.max(0, file.size - Number(match[2])); end = match[1] && match[2] ? Math.min(Number(match[2]), end) : end; if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= file.size) return new NextResponse(null, { status: 416, headers: { ...headers, "Content-Range": "bytes */" + file.size } }); status = 206; headers["Content-Range"] = "bytes " + start + "-" + end + "/" + file.size; }
  headers["Content-Length"] = String(end - start + 1);
  if (request.method === "HEAD") return new NextResponse(null, { status, headers });
  const stream = createReadStream(result.filename!, { start, end });
  request.signal.addEventListener("abort", () => stream.destroy(), { once: true });
  return new NextResponse(Readable.toWeb(stream) as ReadableStream<Uint8Array>, { status, headers });
}
export const HEAD = GET;
