import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { ids?: unknown } | null;
  if (!Array.isArray(body?.ids) || body.ids.length > 1000 || body.ids.some(id => typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(id))) return NextResponse.json({ error: "A valid favorites list is required" }, { status: 400 });
  const ids = [...new Set(body.ids as string[])];
  const records = await prisma.mediaItem.findMany({ where: { id: { in: ids } }, include: { post: { select: { caption: true, takenAt: true } } } });
  const items = ids.flatMap(id => { const record = records.find(media => media.id === id); return record ? [{ id: record.id, fileName: record.fileName, originalName: record.originalName, thumbnail: record.thumbnail, playbackFile: record.playbackFile, mediaType: record.mediaType, position: record.position, postId: record.postId, caption: record.post.caption, takenAt: record.post.takenAt.toISOString() }] : []; });
  return NextResponse.json({ items });
}
