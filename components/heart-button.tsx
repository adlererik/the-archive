"use client";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
type HeartState = { count: number; liked: boolean };
let pending: { id: string; resolve: (state: HeartState) => void }[] = [];
let scheduled = false;
function loadHeart(id: string): Promise<HeartState> {
  return new Promise(resolve => {
    pending.push({ id, resolve });
    if (scheduled) return;
    scheduled = true;
    setTimeout(async () => {
      scheduled = false;
      const batch = pending; pending = [];
      for (let offset = 0; offset < batch.length; offset += 100) {
        const group = batch.slice(offset, offset + 100);
        try {
          const response = await fetch("/api/likes?ids=" + encodeURIComponent([...new Set(group.map(item => item.id))].join(",")));
          if (!response.ok) throw new Error("Unable to load hearts");
          const data = await response.json();
          group.forEach(item => item.resolve(data[item.id] || { count: 0, liked: false }));
        } catch { group.forEach(item => item.resolve({ count: 0, liked: false })); }
      }
    }, 0);
  });
}
export function HeartButton({ postId }: { postId: string }) {
  const [heart, setHeart] = useState<HeartState>({ count: 0, liked: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void loadHeart(postId).then(state => { if (active) setHeart(state); });
    return () => { active = false; };
  }, [postId]);
  async function toggle() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/likes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId, liked: !heart.liked }) });
      if (!response.ok) throw new Error("Unable to save your heart. Try again.");
      setHeart(await response.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save heart"); }
    finally { setBusy(false); }
  }
  return <div><button onClick={toggle} disabled={busy} aria-pressed={heart.liked} aria-label={heart.liked ? "Remove heart" : "Heart this memory"} className={"mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border px-3 text-sm transition disabled:opacity-50 " + (heart.liked ? "border-rose-400/40 text-rose-300" : "border-white/10 text-white/55 hover:text-rose-300")}><Heart className={"h-4 w-4 " + (heart.liked ? "fill-current" : "")} /> {heart.count}</button>{error ? <p role="status" className="mt-1 text-xs text-rose-300">{error}</p> : null}</div>;
}
