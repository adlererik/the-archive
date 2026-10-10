import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieOptions, createSessionToken, credentialsMatch } from "@/lib/auth";
import { getAdminAuthMode } from "@/lib/admin-auth-settings";

export async function POST(request: NextRequest) {
  if (await getAdminAuthMode() === "cloudflare") return NextResponse.json({ error: "Use Cloudflare sign-in for this installation." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!await credentialsMatch(body?.username, body?.password)) return NextResponse.json({ error: "Incorrect username or password" }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, await createSessionToken(), adminCookieOptions);
  return response;
}
