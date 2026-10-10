import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieOptions, createSessionToken } from "@/lib/auth";
import { getAdminAuthMode, getCloudflareAccessConfig } from "@/lib/admin-auth-settings";
import { validateCloudflareAccess } from "@/lib/cloudflare-access";

export async function GET(request: NextRequest) {
  if (await getAdminAuthMode() !== "cloudflare") return new NextResponse(null, { status: 303, headers: { Location: "/admin/login", "Cache-Control": "no-store" } });
  const config = getCloudflareAccessConfig();
  if (config && request.headers.get("host")?.toLowerCase() !== config.hostname) return new NextResponse(null, { status: 303, headers: { Location: `https://${config.hostname}/admin`, "Cache-Control": "no-store" } });
  const claims = await validateCloudflareAccess(request.headers.get("cf-access-jwt-assertion"), request.headers.get("host"));
  if (!claims) return new NextResponse(null, { status: 303, headers: { Location: "/admin/access-error", "Cache-Control": "no-store" } });
  const maxAge = Math.min(adminCookieOptions.maxAge, claims.exp - Math.floor(Date.now() / 1000));
  if (maxAge <= 0) return new NextResponse(null, { status: 303, headers: { Location: "/admin/access-error", "Cache-Control": "no-store" } });
  const response = new NextResponse(null, { status: 303, headers: { Location: "/admin", "Cache-Control": "no-store" } });
  response.cookies.set(ADMIN_COOKIE, await createSessionToken({ cloudflareExpires: claims.exp }), { ...adminCookieOptions, maxAge });
  return response;
}
