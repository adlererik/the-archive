"use client";
import { RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
export type VisitRow = { id: string; city: string; country: string; region: string; device: string; os: string; browser: string; language: string; referrer: string; userAgent: string; createdAt: string };
export type VisitorStats = { visits: number; visitors: number; cities: number; posts: number; media: number; hearts: number };

export function VisitorStatsPanel({ visits, stats, breakdown }: { visits: VisitRow[]; stats: VisitorStats; breakdown: { device: string; count: number }[] }) {
  const router = useRouter();
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [status, setStatus] = useState("");
  async function clear() {
    setClearing(true); setStatus("");
    try {
      const response = await fetch("/api/admin/visitors", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to reset visitor information");
      setConfirmClear(false); setStatus("All recorded visitor information has been cleared. New visits will be recorded from now on."); router.refresh();
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to reset visitor information"); }
    finally { setClearing(false); }
  }
  return <section><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-editorial text-3xl">Visitor statistics</h2><div className="flex flex-wrap items-center gap-4"><button onClick={() => router.refresh()} className="flex min-h-11 items-center gap-2 text-sm text-studio-soft"><RefreshCw className="h-4 w-4" /> Refresh</button><button onClick={() => setConfirmClear(true)} className="flex min-h-11 items-center gap-2 rounded-full border border-red-300/20 px-4 text-sm text-red-200"><Trash2 className="h-4 w-4" /> Clear all visitor information</button></div></div>
    {confirmClear ? <div className="mt-4 rounded-xl border border-red-300/25 bg-red-300/5 p-4"><p className="text-sm text-white/80">Permanently delete all visit history and reset visitor statistics? Posts, media, hearts, and admin settings will be kept.</p><div className="mt-3 flex flex-wrap gap-3"><button disabled={clearing} onClick={clear} className="min-h-11 rounded-full bg-red-200 px-5 text-sm font-semibold text-black disabled:opacity-50">{clearing ? "Clearing…" : "Delete visit history"}</button><button disabled={clearing} onClick={() => setConfirmClear(false)} className="min-h-11 px-4 text-sm text-white/70">Cancel</button></div></div> : null}
    <p role="status" className="mt-3 text-sm text-studio-soft">{status}</p><p className="mt-2 text-sm text-white/50">Visit records are retained for 90 days. Browser cookies identify repeat visits; counts are not verified people. Cities are estimated from public IP addresses using a local lookup database.</p>
    <div className="my-6 grid grid-cols-2 gap-3 md:grid-cols-3">{Object.entries(stats).map(([name, value]) => <div key={name} className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><p className="text-xs uppercase tracking-widest text-white/45">{name === "visitors" ? "Browser identities" : name === "cities" ? "Identified cities" : name}</p><p className="mt-2 font-editorial text-4xl text-studio-soft">{value.toLocaleString()}</p></div>)}</div>
    <div className="mb-6 flex flex-wrap gap-3">{breakdown.map(row => <span key={row.device} className="rounded-full border border-white/10 px-3 py-2 text-sm text-white/65">{row.device}: {row.count}</span>)}</div><h3 className="mb-3 text-sm text-white/70">50 most recent visits</h3><div className="overflow-x-auto rounded-xl border border-white/10"><table className="w-full min-w-[750px] text-left text-sm"><thead className="bg-white/[.04] text-white/45"><tr>{["Time", "Approximate city", "Device / OS", "Browser", "Details"].map(label => <th key={label} className="p-3 font-normal">{label}</th>)}</tr></thead><tbody>{visits.map(v => <tr key={v.id} className="border-t border-white/10 align-top text-white/75"><td className="whitespace-nowrap p-3">{new Date(v.createdAt).toLocaleString()}</td><td className="p-3">{v.city || (v.country ? "City unavailable" : "Location unavailable")}<br /><span className="text-xs text-white/45">{[v.region, v.country].filter(Boolean).join(", ")}</span></td><td className="p-3">{v.device}<br /><span className="text-white/45">{v.os}</span></td><td className="p-3">{v.browser}</td><td className="max-w-xs p-3"><details><summary className="cursor-pointer text-studio-soft">Browser report</summary><p className="mt-2 break-words text-xs">Language: {v.language || "Unknown"}<br />Referrer: {v.referrer}<br />{v.userAgent}</p></details></td></tr>)}</tbody></table>{!visits.length ? <p className="p-6 text-sm text-white/50">No recorded visits yet. Open the wall, then refresh these stats.</p> : null}</div><p className="mt-4 text-xs leading-relaxed text-white/40">Private/local IP addresses are not stored or shown. Local Wi-Fi visitors cannot be located from their private IP. VPNs and mobile networks may report a different city; some addresses have no city data. Device labels are inferred from browser reports.</p>
  </section>;
}
