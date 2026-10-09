import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { visitor, visitorResponse } from "@/lib/visitor";

export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") || "").split(",").filter(Boolean).slice(0, 100);
  const identity = visitor(request);
  const counts = await prisma.postLike.groupBy({ by: ["postId"], where: { postId: { in: ids } }, _count: { _all: true } });
  const mine = await prisma.postLike.findMany({ where: { postId: { in: ids }, visitorKey: identity.key }, select: { postId: true } });
  return visitorResponse(Object.fromEntries(ids.map(id => [id, { count: counts.find(c => c.postId === id)?._count._all || 0, liked: mine.some(l => l.postId === id) }])), identity);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) {
    try { if (new URL(origin).host !== request.headers.get("host")) return NextResponse.json({ error: "Invalid origin" }, { status: 403 }); }
    catch { return NextResponse.json({ error: "Invalid origin" }, { status: 403 }); }
  }
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  if (typeof body.postId !== "string" || typeof body.liked !== "boolean") return NextResponse.json({ error: "Invalid heart" }, { status: 400 });
  const identity = visitor(request);
  if (!await prisma.post.findUnique({ where: { id: body.postId }, select: { id: true } })) return NextResponse.json({ error: "Memory not found" }, { status: 404 });
  if (body.liked) await prisma.postLike.upsert({ where: { postId_visitorKey: { postId: body.postId, visitorKey: identity.key } }, create: { postId: body.postId, visitorKey: identity.key }, update: {} });
  else await prisma.postLike.deleteMany({ where: { postId: body.postId, visitorKey: identity.key } });
  return visitorResponse({ count: await prisma.postLike.count({ where: { postId: body.postId } }), liked: body.liked }, identity);
}
