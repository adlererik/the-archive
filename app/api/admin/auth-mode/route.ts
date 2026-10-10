import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE, adminCookieOptions, createSessionToken, getAdminAccount, isValidSession, passwordMatches } from "@/lib/auth";
import { getAdminAuthSettings, setAdminAuthMode } from "@/lib/admin-auth-settings";
import { validateCloudflareAccess } from "@/lib/cloudflare-access";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  if (!await isValidSession(request.cookies.get(ADMIN_COOKIE)?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const origin = request.headers.get("origin");
  if (!origin || ![`https://${request.headers.get("host")}`, `http://${request.headers.get("host")}`].includes(origin)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (body?.mode !== "password" && body?.mode !== "cloudflare") return NextResponse.json({ error: "Choose a supported login method." }, { status: 400 });
  let cloudflareExpires: number | undefined;
  const account = await getAdminAccount();
  if (body.mode === "cloudflare") {
    const claims = await validateCloudflareAccess(request.headers.get("cf-access-jwt-assertion"), request.headers.get("host"));
    if (!claims) return NextResponse.json({ error: "Open this page through Cloudflare and sign in with the approved owner account before enabling this method." }, { status: 403 });
    cloudflareExpires = claims.exp;
  } else if (!await passwordMatches(body.currentPassword, account.passwordHash)) {
    return NextResponse.json({ error: "Enter the correct CMS password before switching to password login." }, { status: 403 });
  }
  await prisma.adminAccount.update({ where: { id: account.id }, data: { sessionVersion: randomUUID() } });
  await setAdminAuthMode(body.mode);
  const response = NextResponse.json(await getAdminAuthSettings());
  response.cookies.set(ADMIN_COOKIE, await createSessionToken({ cloudflareExpires }), { ...adminCookieOptions, ...(cloudflareExpires ? { maxAge: Math.min(adminCookieOptions.maxAge, cloudflareExpires - Math.floor(Date.now() / 1000)) } : {}) });
  revalidatePath("/admin"); revalidatePath("/"); revalidatePath("/admin/login");
  return response;
}
