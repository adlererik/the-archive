"use client";
import { CheckCircle2, LoaderCircle, UploadCloud } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MediaEditor, draftFiles, type MediaDraft } from "./media-editor";
import { SoundtrackEditor, appendTrack, initialTrack } from "./soundtrack-editor";
function nowLocal() { const date = new Date(); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
export function AdminUploader({ initialDate }: { initialDate?: string }) {
  const [items, setItems] = useState<MediaDraft[]>([]); const [caption, setCaption] = useState(""); const [takenAt, setTakenAt] = useState(initialDate || nowLocal);
  const [track, setTrack] = useState(initialTrack); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const router = useRouter();
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!items.length) { setMessage("Choose one or more media files first."); return; } setBusy(true); setMessage("");
    try {
      const form = new FormData(); form.set("caption", caption); form.set("takenAt", new Date(takenAt).toISOString()); draftFiles(items).forEach(file => form.append("files", file)); appendTrack(form, track);
      const response = await fetch("/api/admin/posts", { method: "POST", body: form }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Upload failed");
      setItems([]); setCaption(""); setTrack(initialTrack()); setTakenAt(nowLocal()); setMessage("Memory added to The Archive."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload failed"); } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="studio-panel rounded-3xl border border-white/10 p-5 sm:p-8"><p className="text-[10px] uppercase tracking-[.24em] text-studio-accent">A new chapter</p><h2 className="mt-2 font-editorial text-4xl">Add a memory</h2><p className="mt-2 text-sm text-white/55">One photo or an entire carousel. Place it anywhere in your story.</p><fieldset disabled={busy} className="mt-7 space-y-7 disabled:opacity-60"><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm text-white/70">Place in timeline<input type="datetime-local" required value={takenAt} onChange={event => setTakenAt(event.target.value)} className="studio-input mt-2 block w-full rounded-xl border border-white/15 px-3 py-3 text-white" /><span className="mt-2 block text-xs text-white/45">Backdate to any year; the wall finds its place automatically.</span></label><label className="text-sm text-white/70">Caption<textarea rows={3} value={caption} onChange={event => setCaption(event.target.value)} placeholder="Tell this memory’s story…" className="studio-input mt-2 block w-full rounded-xl border border-white/15 px-3 py-3 text-white" /></label></div><MediaEditor items={items} onChange={setItems} /><SoundtrackEditor value={track} onChange={setTrack} />{message ? <p role="status" className={"flex items-center gap-2 text-sm " + (message === "Memory added to The Archive." ? "text-emerald-500" : "text-red-400")}>{message === "Memory added to The Archive." ? <CheckCircle2 className="h-4 w-4" /> : null}{message}</p> : null}<div className="flex justify-end"><button disabled={!items.length} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-studio-fill px-6 text-sm font-semibold text-black disabled:opacity-40">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}{busy ? "Preparing media…" : "Save to archive"}</button></div></fieldset></form>;
}
