import os from "os";
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export function GET(request: NextRequest) {
  let origin = process.env.CAST_MEDIA_ORIGIN || process.env.NEXT_PUBLIC_CAST_MEDIA_ORIGIN || request.nextUrl.origin;
  try {
    const url = new URL(origin); if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Invalid casting origin");
    if (["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
      const addresses = Object.entries(os.networkInterfaces()).filter(([name]) => !/^(lo|docker|br-|veth|tun|virbr)/.test(name)).flatMap(([, entries]) => (entries || []).filter(entry => entry.family === "IPv4" && !entry.internal).map(entry => entry.address));
      const lan = addresses.find(address => address.startsWith("192.168.")) || addresses[0]; if (lan) url.hostname = lan;
    }
    origin = url.origin; return NextResponse.json({ mediaOrigin: origin });
  } catch { return NextResponse.json({ error: "Configure a valid CAST_MEDIA_ORIGIN for your TV" }, { status: 503 }); }
}
