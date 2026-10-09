import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE, adminCookieOptions, createSessionToken, getAdminAccount, hashPassword, isValidSession, passwordMatches } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  if (!await isValidSession(request.cookies.get(ADMIN_COOKIE)?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  if (!/^[a-zA-Z0-9_.@-]{3,64}$/.test(username)) return NextResponse.json({ error: "Username must have 3–64 letters, numbers, dots, underscores, @ or hyphens." }, { status: 400 });
  if (typeof body?.newPassword !== "string" || (body.newPassword && (body.newPassword.length < 8 || body.newPassword.length > 128))) return NextResponse.json({ error: "Use a password of 8–128 characters, or leave it blank to keep your password." }, { status: 400 });
  const account = await getAdminAccount();
  if (!await passwordMatches(body?.currentPassword, account.passwordHash)) return NextResponse.json({ error: "Your current password is incorrect." }, { status: 403 });
  const passwordHash = body.newPassword ? await hashPassword(body.newPassword) : account.passwordHash;
  const changed = await prisma.adminAccount.updateMany({ where: { id: account.id, sessionVersion: account.sessionVersion }, data: { username, passwordHash, sessionVersion: randomUUID() } });
  if (!changed.count) return NextResponse.json({ error: "The login changed in another session. Sign in again." }, { status: 409 });
  const response = NextResponse.json({ ok: true, username });
  response.cookies.set(ADMIN_COOKIE, await createSessionToken(), adminCookieOptions);
  revalidatePath("/admin"); revalidatePath("/");
  return response;
}
