import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { MediaType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidSession } from "@/lib/auth";
import { toArchivePost } from "@/lib/archive";
import { prisma } from "@/lib/prisma";
import { generateThumbnail } from "@/lib/thumbnails";
import { prepareVideo } from "@/lib/video";

const allowed = new Set([".mp4", ".mov", ".jpg", ".jpeg", ".png", ".webp"]);

function mediaType(extension: string) { return extension === ".mp4" || extension === ".mov" ? MediaType.VIDEO : MediaType.IMAGE; }

export async function POST(request: NextRequest) {
  const jar = await cookies();
  if (!await isValidSession(jar.get(ADMIN_COOKIE)?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const caption = String(form.get("caption") || "");
  const date = new Date(String(form.get("takenAt") || ""));
  const files = form.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);
  if (Number.isNaN(date.valueOf())) return NextResponse.json({ error: "A valid date is required" }, { status: 400 });
  if (!files.length) return NextResponse.json({ error: "Add at least one image or video" }, { status: 400 });
  if (files.some((file) => !allowed.has(path.extname(file.name).toLowerCase()))) return NextResponse.json({ error: "Only MP4, MOV, JPG, JPEG, PNG, and WEBP files are accepted" }, { status: 400 });

  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  const written: { fileName: string; originalName: string; mediaType: MediaType; position: number; thumbnail: string | null; playbackFile: string | null }[] = [];
  try {
    for (const [position, file] of files.entries()) {
      const extension = path.extname(file.name).toLowerCase();
      const fileName = Date.now() + "-" + randomUUID() + extension;
      await writeFile(path.join(directory, fileName), Buffer.from(await file.arrayBuffer()));
      const item = { fileName, originalName: path.basename(file.name), mediaType: mediaType(extension), position, thumbnail: null as string | null, playbackFile: null as string | null };
      written.push(item);
      item.thumbnail = await generateThumbnail(fileName);
      if (item.mediaType === MediaType.VIDEO) item.playbackFile = await prepareVideo(fileName);
    }
    const record = await prisma.post.create({ data: { caption, takenAt: date, mediaItems: { create: written } }, include: { mediaItems: { orderBy: { position: "asc" } } } });
    revalidatePath("/"); revalidatePath("/admin");
    return NextResponse.json({ post: toArchivePost(record) }, { status: 201 });
  } catch (error) {
    await Promise.all(written.flatMap((media) => [media.fileName, media.thumbnail, media.playbackFile].filter((name): name is string => Boolean(name))).map((fileName) => unlink(path.join(directory, fileName)).catch(() => undefined)));
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save memory" }, { status: 500 });
  }
}
