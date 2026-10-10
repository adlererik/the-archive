import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidSession } from "@/lib/auth";
import { toArchivePost } from "@/lib/archive";
import { prisma } from "@/lib/prisma";
import { removeCastSlides } from "@/lib/cast-slides";
import { removeFiles, storeMedia, storeSoundtrack, validateFiles } from "@/lib/post-media";
import { soundtrackSettings } from "@/lib/soundtrack";

async function authorized() { return isValidSession((await cookies()).get(ADMIN_COOKIE)?.value); }
function refresh() { revalidatePath("/"); revalidatePath("/admin"); revalidatePath("/favorites"); }

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await authorized()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.post.findUnique({ where: { id }, include: { mediaItems: true } });
  if (!existing) return NextResponse.json({ error: "Memory not found" }, { status: 404 });
  const ledger: string[] = []; let committed = false;
  try {
    const multipart = request.headers.get("content-type")?.includes("multipart/form-data");
    const form = multipart ? await request.formData() : null;
    const body = form ? { caption: form.get("caption"), takenAt: form.get("takenAt") } : await request.json();
    const takenAt = new Date(typeof body.takenAt === "string" ? body.takenAt : "");
    if (Number.isNaN(takenAt.valueOf())) throw new Error("A valid date is required.");
    const files = form ? form.getAll("files").filter((item): item is File => item instanceof File && item.size > 0) : [];
    const audioValue = form?.get("soundtrack"); const audio = audioValue instanceof File && audioValue.size > 0 ? audioValue : null;
    validateFiles(files, audio);
    // Manifest contains existing IDs and new:<index> tokens. Every token must belong to this post/request.
    const order: unknown = form ? JSON.parse(String(form.get("order") || "[]")) : existing.mediaItems.sort((a, b) => a.position - b.position).map(m => m.id);
    if (!Array.isArray(order) || !order.length || order.length > 200 || order.some(token => typeof token !== "string") || new Set(order).size !== order.length) throw new Error("Keep at least one media item and use a valid order (up to 200 items).");
    const tokens = order as string[];
    const ids = new Set(existing.mediaItems.map(m => m.id));
    if (tokens.some(token => !ids.has(token) && !/^new:\d+$/.test(token))) throw new Error("Invalid carousel item.");
    const newIndexes = tokens.filter(token => token.startsWith("new:")).map(token => Number(token.slice(4)));
    if (newIndexes.length !== files.length || newIndexes.some(index => !Number.isInteger(index) || index < 0 || index >= files.length)) throw new Error("The selected files and carousel order do not match.");
    const added: Awaited<ReturnType<typeof storeMedia>>[] = [];
    for (const [index, file] of files.entries()) added.push(await storeMedia(file, tokens.indexOf("new:" + index), ledger));
    const uploaded = audio ? await storeSoundtrack(audio, ledger) : null;
    const removeAudio = form?.get("removeSoundtrack") === "true";
    if (removeAudio && uploaded) throw new Error("Choose a replacement soundtrack or remove it, not both.");
    const trackDuration = uploaded?.soundtrackDuration ?? existing.soundtrackDuration;
    const settings = form && !removeAudio && (uploaded || existing.soundtrackFile) ? soundtrackSettings(JSON.parse(String(form.get("soundtrackSettings") || "null")), trackDuration) : {};
    const removed = existing.mediaItems.filter(m => !tokens.includes(m.id));
    const expected = String(form?.get("updatedAt") || existing.updatedAt.toISOString());
    const record = await prisma.$transaction(async tx => {
      const updated = await tx.post.updateMany({ where: { id, updatedAt: new Date(expected) }, data: { caption: typeof body.caption === "string" ? body.caption : "", takenAt, ...(removeAudio ? { soundtrackFile: null, soundtrackName: null, soundtrackDuration: 0, soundtrackStart: 0, soundtrackEnd: null } : uploaded || {}), ...settings } });
      if (!updated.count) throw new Error("This memory changed in another window. Close and reopen the editor before saving.");
      await tx.mediaItem.deleteMany({ where: { id: { in: removed.map(m => m.id) }, postId: id } });
      for (const [position, token] of tokens.entries()) if (ids.has(token)) await tx.mediaItem.update({ where: { id: token }, data: { position } });
      for (const data of added) await tx.mediaItem.create({ data: { ...data, postId: id } });
      return tx.post.findUniqueOrThrow({ where: { id }, include: { mediaItems: { orderBy: { position: "asc" } } } });
    });
    committed = true;
    await Promise.all(existing.mediaItems.map(media => removeCastSlides(media.id)));
    await removeFiles([...removed.flatMap(m => [m.fileName, m.thumbnail, m.playbackFile]), ...((removeAudio || uploaded) ? [existing.soundtrackFile] : [])]);
    refresh();
    return NextResponse.json({ post: toArchivePost(record) });
  } catch (error) {
    if (!committed) await removeFiles(ledger);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save changes" }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await authorized()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const record = await prisma.post.findUnique({ where: { id }, include: { mediaItems: true } });
  if (!record) return NextResponse.json({ error: "Memory not found" }, { status: 404 });
  await prisma.post.delete({ where: { id } });
  await Promise.all(record.mediaItems.map(media => removeCastSlides(media.id)));
  await removeFiles([record.soundtrackFile, ...record.mediaItems.flatMap(m => [m.fileName, m.thumbnail, m.playbackFile])]);
  refresh();
  return new NextResponse(null, { status: 204 });
}
