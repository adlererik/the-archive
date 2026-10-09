"use client";

import { LoaderCircle, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { ArchivePost } from "@/lib/archive";
import { localDateTime } from "@/lib/dates";
import { useModal } from "@/lib/use-modal";

type Props = { post: ArchivePost; onClose: () => void; onUpdated: (post: ArchivePost) => void; onDeleted: (id: string) => void };

export function EditPostModal({ post, onClose, onUpdated, onDeleted }: Props) {
  const modalRef = useModal(onClose);
  const [caption, setCaption] = useState(post.caption);
  const [takenAt, setTakenAt] = useState(localDateTime(post.takenAt));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/posts/" + post.id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ caption, takenAt: new Date(takenAt).toISOString() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save changes");
      onUpdated(data.post);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save changes"); }
    finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/posts/" + post.id, { method: "DELETE" });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Unable to delete memory"); }
      onDeleted(post.id);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to delete memory"); setBusy(false); }
  }

  return <div ref={modalRef} tabIndex={-1} className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Edit memory">
    <form onSubmit={save} className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#121215] p-6 shadow-2xl sm:p-8">
      <div className="flex items-start justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d4af37]">Archive management</p><h2 className="mt-2 font-editorial text-3xl">Edit memory</h2></div><button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/70 hover:text-white"><X className="h-5 w-5" /></button></div>
      <label className="mt-7 block text-sm text-white/75">Date and time<input type="datetime-local" value={takenAt} onChange={(event) => setTakenAt(event.target.value)} required className="mt-2 block w-full rounded-xl border border-white/15 bg-black/40 px-3 py-3 text-white outline-none focus:border-[#d4af37]" /></label>
      <label className="mt-5 block text-sm text-white/75">Caption<textarea value={caption} onChange={(event) => setCaption(event.target.value)} rows={6} className="mt-2 block w-full resize-y rounded-xl border border-white/15 bg-black/40 px-3 py-3 text-white outline-none focus:border-[#d4af37]" /></label>
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      <div className="mt-7 flex flex-wrap justify-between gap-3"><button type="button" disabled={busy} onClick={remove} className="flex items-center gap-2 rounded-full border border-red-400/35 px-4 py-2.5 text-sm text-red-200 hover:bg-red-400/10 disabled:opacity-50"><Trash2 className="h-4 w-4" /> Delete permanently</button><button disabled={busy} className="flex min-w-32 items-center justify-center gap-2 rounded-full bg-[#d4af37] px-5 py-2.5 text-sm font-bold text-black hover:bg-[#e5bd51] disabled:opacity-50">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Save changes"}</button></div>
    </form>
  </div>;
}
