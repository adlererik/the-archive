import { NextRequest, NextResponse } from "next/server";
import { saveSharedSelection, selectedMedia, validSelection } from "@/lib/shared-links";
import { visitor } from "@/lib/visitor";

const attempts = new Map<string, { count: number; start: number }>();
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  try { if (!origin || new URL(origin).host !== request.headers.get("host")) return NextResponse.json({ error: "Open the archive to create a link." }, { status: 403 }); }
  catch { return NextResponse.json({ error: "Invalid origin." }, { status: 403 }); }
  if (Number(request.headers.get("content-length")) > 150000) return NextResponse.json({ error: "This selection is too large." }, { status: 413 });
  const text = await request.text();
  if (text.length > 150000) return NextResponse.json({ error: "This selection is too large." }, { status: 413 });
  let data: unknown;
  try { data = JSON.parse(text); } catch { return NextResponse.json({ error: "A valid media selection is required." }, { status: 400 }); }
  if (!validSelection(data)) return NextResponse.json({ error: "Choose up to 1,000 photos or videos." }, { status: 400 });
  // Same selections reuse their compact URL. Bound new requests per signed browser identity.
  const identity = visitor(request);
  const key = identity.fresh ? "anonymous" : identity.key;
  const now = Date.now();
  for (const [id, value] of attempts) if (now - value.start > 3600000) attempts.delete(id);
  const attempt = attempts.get(key) || { count: 0, start: now };
  if (attempt.count >= 120 || (!attempts.has(key) && attempts.size >= 10000)) return NextResponse.json({ error: "Please wait before creating more links." }, { status: 429 });
  attempts.set(key, { ...attempt, count: attempt.count + 1 });
  const ids = [...new Set(data.ids)];
  const items = await selectedMedia(ids);
  if (items.length !== ids.length) return NextResponse.json({ error: "Some media is no longer available. Refresh your selection." }, { status: 404 });
  const url = await saveSharedSelection({ kind: data.kind, ids, seconds: data.seconds, loop: data.loop });
  return NextResponse.json({ url }, { headers: { "Cache-Control": "no-store" } });
}
