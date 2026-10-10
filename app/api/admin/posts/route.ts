import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidSession } from "@/lib/auth";
import { toArchivePost } from "@/lib/archive";
import { prisma } from "@/lib/prisma";
import { removeFiles, storeMedia, storeSoundtrack, validateFiles } from "@/lib/post-media";
import { soundtrackSettings } from "@/lib/soundtrack";

export async function POST(request: NextRequest) {
  const jar = await cookies();
  if (!await isValidSession(jar.get(ADMIN_COOKIE)?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ledger: string[] = [];
  let committed = false;
  try {
    const form = await request.formData();
    const date = new Date(String(form.get("takenAt") || ""));
    const files = form.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);
    const audioValue = form.get("soundtrack"); const audio = audioValue instanceof File && audioValue.size > 0 ? audioValue : null;
    if (Number.isNaN(date.valueOf())) throw new Error("A valid date is required.");
    if (!files.length) throw new Error("Add at least one image or video.");
    validateFiles(files, audio);
    const media = [];
    for (const [position, file] of files.entries()) media.push(await storeMedia(file, position, ledger));
    const soundtrack = audio ? await storeSoundtrack(audio, ledger) : null;
    const settings = soundtrack ? soundtrackSettings(JSON.parse(String(form.get("soundtrackSettings") || "null")), soundtrack.soundtrackDuration) : {};
    const record = await prisma.post.create({ data: { caption: String(form.get("caption") || ""), takenAt: date, ...soundtrack, ...settings, mediaItems: { create: media } }, include: { mediaItems: { orderBy: { position: "asc" } } } });
    committed = true;
    revalidatePath("/"); revalidatePath("/admin"); revalidatePath("/favorites");
    return NextResponse.json({ post: toArchivePost(record) }, { status: 201 });
  } catch (error) {
    if (!committed) await removeFiles(ledger);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save memory" }, { status: 400 });
  }
}
