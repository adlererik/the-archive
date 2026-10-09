import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export function GET() {
  const configured = process.env.CAST_MEDIA_ORIGIN || process.env.NEXT_PUBLIC_CAST_MEDIA_ORIGIN;
  // Erik Adler: the browser knows the public HTTPS address; the local Next.js
  // request URL can instead contain the origin's HTTP listener behind a tunnel.
  if (!configured) return NextResponse.json({ mediaOrigin: null }, { headers: { "Cache-Control": "no-store" } });
  try {
    const url = new URL(configured);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || ["localhost", "0.0.0.0", "127.0.0.1", "[::1]", "[::]"].includes(url.hostname)) throw new Error("Invalid casting origin");
    return NextResponse.json({ mediaOrigin: url.origin }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "The configured TV media address is invalid. Contact the site administrator." }, { status: 503 }); }
}
