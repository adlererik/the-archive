"use client";
import { BarChart3, Info, Pencil, UserRound, Upload } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HeaderSettings } from "@/lib/settings";
import { AdminUploader } from "./admin-uploader";
import { AdminAccount } from "./admin-account";
import { VisitorStatsPanel, type VisitRow, type VisitorStats } from "./visitor-stats";

type Props = { username: string; header: HeaderSettings; visits: VisitRow[]; stats: VisitorStats; breakdown: { device: string; count: number }[]; documents: { title: string; content: string }[] };

export function AdminConsole({ username, header, visits, stats, breakdown, documents }: Props) {
  const [tab, setTab] = useState("upload");
  const [fields, setFields] = useState(header);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function saveHeader(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setStatus("");
    try {
      const response = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save header");
      setStatus("Header saved. The wall now uses your text."); router.refresh();
    } catch (e) { setStatus(e instanceof Error ? e.message : "Unable to save header"); }
    finally { setBusy(false); }
  }
  const tabs = [{ id: "upload", name: "Upload", icon: Upload }, { id: "stats", name: "Visitor stats", icon: BarChart3 }, { id: "header", name: "Header text", icon: Pencil }, { id: "account", name: "Login settings", icon: UserRound }, { id: "info", name: "Info & documentation", icon: Info }];
  return <>
    <nav className="mb-7 flex flex-wrap gap-2" aria-label="Admin sections">{tabs.map(({ id, name, icon: Icon }) => <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)} className={"flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm " + (tab === id ? "border-[#d4af37]/50 bg-studio-fill/10 text-studio-soft" : "border-white/10 text-white/60")}><Icon className="h-4 w-4" /> {name}</button>)}</nav>
    {tab === "upload" ? <AdminUploader /> : null}
    {tab === "header" ? <section className="rounded-2xl border border-white/10 bg-white/[.03] p-6"><h2 className="font-editorial text-3xl">Make it your archive</h2><form onSubmit={saveHeader} className="mt-6 space-y-5">{(["title", "eyebrow", "description"] as const).map(key => <label key={key} className="block text-sm capitalize text-white/70">{key === "eyebrow" ? "Small label above the title" : key}<input value={fields[key]} required={key === "title"} maxLength={key === "description" ? 1000 : 120} onChange={e => setFields({ ...fields, [key]: e.target.value })} className="mt-2 block w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white" /></label>)}<button disabled={busy} className="min-h-11 rounded-full bg-studio-fill px-5 text-sm font-semibold text-black disabled:opacity-50">{busy ? "Saving…" : "Save header"}</button><p role="status" className="text-sm text-studio-soft">{status}</p></form></section> : null}
    {tab === "stats" ? <VisitorStatsPanel visits={visits} stats={stats} breakdown={breakdown} /> : null}
    {tab === "account" ? <AdminAccount username={username} /> : null}
    {tab === "info" ? <section><h2 className="font-editorial text-3xl">Archive handbook</h2><p className="my-4 text-sm text-white/55">Start, stop, restart, update, back up, migrate, and configure startup at boot. Commands for your local launcher and a future Linux service are documented separately.</p>{documents.map(doc => <details key={doc.title} className="mb-4 rounded-2xl border border-white/10 bg-white/[.03] p-5" open={doc.title === "Operations & server migration"}><summary className="cursor-pointer text-studio-soft">{doc.title}</summary><pre className="mt-5 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-white/75">{doc.content}</pre></details>)}</section> : null}
  </>;
}
