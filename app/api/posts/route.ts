import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toArchivePost } from "@/lib/archive";
import { decodeCursor, encodeCursor } from "@/lib/pagination";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cursor = request.nextUrl.searchParams.get("cursor");
  const boundary = cursor ? decodeCursor(cursor) : null;
  if (cursor && !boundary) return NextResponse.json({ error: "Invalid timeline cursor" }, { status: 400 });
  const records = await prisma.post.findMany({
    take: 33,
    ...(boundary ? { where: { OR: [{ takenAt: { lt: boundary.takenAt } }, { takenAt: boundary.takenAt, id: { lt: boundary.id } }] } } : {}),
    orderBy: [{ takenAt: "desc" }, { id: "desc" }],
    include: { mediaItems: { orderBy: { position: "asc" } } },
  });
  const hasMore = records.length > 32;
  const page = hasMore ? records.slice(0, 32) : records;
  const last = page.at(-1);
  return NextResponse.json({ posts: page.map(toArchivePost), nextCursor: hasMore && last ? encodeCursor(last) : null });
}
