import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieOptions, createSessionToken, credentialsMatch } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!await credentialsMatch(body?.username, body?.password)) return NextResponse.json({ error: "Incorrect username or password" }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, await createSessionToken(), adminCookieOptions);
  return response;
}
