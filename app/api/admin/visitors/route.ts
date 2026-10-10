import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE, isValidSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
  if (!await isValidSession(request.cookies.get(ADMIN_COOKIE)?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const origin = request.headers.get("origin");
  try {
    if (!origin || new URL(origin).host !== request.headers.get("host")) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  } catch { return NextResponse.json({ error: "Invalid origin" }, { status: 403 }); }
  const data = await request.json().catch(() => null);
  const single = typeof data?.id === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(data.id) && data.all !== true;
  const all = data?.all === true && data.id === undefined;
  if (!single && !all) return NextResponse.json({ error: "Choose a visitor record or confirm deletion of all visit history." }, { status: 400 });
  const { count } = single ? await prisma.visit.deleteMany({ where: { id: data.id } }) : await prisma.visit.deleteMany();
  revalidatePath("/admin/settings");
  return NextResponse.json({ ok: true, deleted: count });
}
