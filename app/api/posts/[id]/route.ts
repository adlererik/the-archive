import { unlink } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidSession } from "@/lib/auth";
import { toArchivePost } from "@/lib/archive";
import { prisma } from "@/lib/prisma";

function uploadsPath(fileName: string) { return path.join(process.cwd(), "public", "uploads", path.basename(fileName)); }

async function authorized() {
  const jar = await cookies();
  return isValidSession(jar.get(ADMIN_COOKIE)?.value);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await authorized()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json() as { caption?: unknown; takenAt?: unknown };
  const date = new Date(typeof body.takenAt === "string" ? body.takenAt : "");
  if (Number.isNaN(date.valueOf())) return NextResponse.json({ error: "A valid date is required" }, { status: 400 });
  const record = await prisma.post.update({
    where: { id },
    data: { caption: typeof body.caption === "string" ? body.caption : "", takenAt: date },
    include: { mediaItems: { orderBy: { position: "asc" } } },
  }).catch(() => null);
  if (!record) return NextResponse.json({ error: "Memory not found" }, { status: 404 });
  revalidatePath("/");
  return NextResponse.json({ post: toArchivePost(record) });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await authorized()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const record = await prisma.post.findUnique({ where: { id }, include: { mediaItems: true } });
  if (!record) return NextResponse.json({ error: "Memory not found" }, { status: 404 });
  await prisma.post.delete({ where: { id } });
  await Promise.all(record.mediaItems.flatMap((media) => [media.fileName, media.thumbnail, media.playbackFile].filter((name): name is string => Boolean(name))).map((fileName) => unlink(uploadsPath(fileName)).catch(() => undefined)));
  revalidatePath("/");
  revalidatePath("/admin");
  return new NextResponse(null, { status: 204 });
}
