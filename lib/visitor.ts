import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const VISITOR_COOKIE = "archive_visitor";
function sign(value: string) { return createHmac("sha256", process.env.SESSION_SECRET || "archive-local-session-change-this-before-public-exposure").update("visitor:" + value).digest("base64url"); }
export function visitor(request: NextRequest) {
  const cookie = request.cookies.get(VISITOR_COOKIE)?.value || "";
  const [id, signature] = cookie.split(".");
  const expected = id ? sign(id) : "";
  const valid = Boolean(id && signature && Buffer.byteLength(signature) === Buffer.byteLength(expected) && timingSafeEqual(Buffer.from(signature), Buffer.from(expected)));
  const token = valid ? cookie : (() => { const value = randomUUID(); return value + "." + sign(value); })();
  return { key: sign(token), token, fresh: !valid };
}
export function visitorResponse(data: unknown, identity: ReturnType<typeof visitor>, status = 200) {
  const response = NextResponse.json(data, { status });
  response.headers.set("Cache-Control", "no-store");
  if (identity.fresh) response.cookies.set(VISITOR_COOKIE, identity.token, { httpOnly: true, sameSite: "lax", secure: process.env.SESSION_COOKIE_SECURE === "true", path: "/", maxAge: 31536000 });
  return response;
}
