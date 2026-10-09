import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE, isValidSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  if (!await isValidSession(request.cookies.get(ADMIN_COOKIE)?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let data;
  try { data = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const { title, eyebrow, description } = data || {};
  if (typeof title !== "string" || !title.trim() || title.length > 120 || typeof eyebrow !== "string" || eyebrow.length > 120 || typeof description !== "string" || description.length > 1000) return NextResponse.json({ error: "Use a title of 1–120 characters, a label up to 120, and a description up to 1000." }, { status: 400 });
  const header = { title: title.trim(), eyebrow: eyebrow.trim(), description: description.trim() };
  await prisma.siteSettings.upsert({ where: { id: "site" }, create: { id: "site", ...header }, update: header });
  revalidatePath("/"); revalidatePath("/admin");
  return NextResponse.json(header);
}
