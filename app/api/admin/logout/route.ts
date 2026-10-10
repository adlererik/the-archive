import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieOptions } from "@/lib/auth";
import { getAdminAuthMode, getCloudflareAccessConfig } from "@/lib/admin-auth-settings";

export async function POST() {
  const config = getCloudflareAccessConfig();
  const location = await getAdminAuthMode() === "cloudflare" && config ? `https://${config.hostname}/cdn-cgi/access/logout` : "/";
  const response = new NextResponse(null, { status: 303, headers: { Location: location, "Cache-Control": "no-store" } });
  response.cookies.set(ADMIN_COOKIE, "", { ...adminCookieOptions, maxAge: 0 });
  return response;
}
