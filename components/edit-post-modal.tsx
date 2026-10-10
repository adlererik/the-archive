"use client";
import { LoaderCircle, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { ArchivePost } from "@/lib/archive";
import { localDateTime } from "@/lib/dates";
import { useModal } from "@/lib/use-modal";
import { MediaEditor, draftFiles, draftOrder, type MediaDraft } from "./media-editor";
import { SoundtrackEditor, appendTrack, initialTrack } from "./soundtrack-editor";

type Props = { post: ArchivePost; onClose: () => void; onUpdated: (post: ArchivePost) => void; onDeleted: (id: string) => void };
export function EditPostModal({ post, onClose, onUpdated, onDeleted }: Props) {
  const [busy, setBusy] = useState(false); const modalRef = useModal(() => { if (!busy) onClose(); });
  const [caption, setCaption] = useState(post.caption); const [takenAt, setTakenAt] = useState(localDateTime(post.takenAt));
  const [items, setItems] = useState<MediaDraft[]>(post.mediaItems.map(media => ({ key: media.id, media })));
  const [track, setTrack] = useState(() => initialTrack(post.soundtrack));
  const [error, setError] = useState(""); const [confirmDelete, setConfirmDelete] = useState(false);
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const form = new FormData(); form.set("caption", caption); form.set("takenAt", new Date(takenAt).toISOString()); form.set("updatedAt", post.updatedAt); form.set("order", JSON.stringify(draftOrder(items)));
      draftFiles(items).forEach(file => form.append("files", file)); appendTrack(form, track);
      const response = await fetch("/api/posts/" + post.id, { method: "PATCH", body: form }); const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save changes"); onUpdated(data.post);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save changes"); }
    finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true); setError("");
    try { const response = await fetch("/api/posts/" + post.id, { method: "DELETE" }); if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Unable to delete memory"); } onDeleted(post.id); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to delete memory"); setBusy(false); }
  }
  return <div ref={modalRef} tabIndex={-1} className="fixed inset-0 z-[70] overflow-y-auto bg-black/80 px-3 py-6 backdrop-blur-md sm:p-8" role="dialog" aria-modal="true" aria-label="Edit memory"><form onSubmit={save} className="studio-panel mx-auto w-full max-w-4xl rounded-3xl border border-white/10 p-5 shadow-2xl sm:p-8">
    <div className="flex items-start justify-between gap-5"><div><p className="text-[10px] font-semibold uppercase tracking-[.24em] text-studio-accent">Curate your collection</p><h2 className="mt-2 font-editorial text-4xl">Edit memory</h2><p className="mt-2 text-xs text-white/50">Changes go live together when you save.</p></div><button type="button" disabled={busy} onClick={onClose} aria-label="Close editor" className="grid h-11 w-11 place-items-center rounded-full border border-white/15"><X className="h-5 w-5" /></button></div>
    <fieldset disabled={busy} className="mt-7 space-y-7 disabled:opacity-60"><div className="grid gap-5 sm:grid-cols-[1fr_1.5fr]"><label className="text-sm text-white/70">Place in timeline<input type="datetime-local" value={takenAt} onChange={event => setTakenAt(event.target.value)} required className="studio-input mt-2 block w-full rounded-xl border border-white/15 px-3 py-3 text-white" /><span className="mt-2 block text-xs leading-relaxed text-white/45">Any date, any year. Saving places this memory in chronological order.</span></label><label className="text-sm text-white/70">Caption<textarea value={caption} onChange={event => setCaption(event.target.value)} rows={3} className="studio-input mt-2 block w-full resize-y rounded-xl border border-white/15 px-3 py-3 text-white" /></label></div>
      <MediaEditor items={items} onChange={setItems} /><SoundtrackEditor original={post.soundtrack} value={track} onChange={setTrack} />
      {!items.length ? <p className="text-sm text-red-400">Keep at least one image or video, or delete the entire memory.</p> : null}
      {error ? <p role="alert" className="text-sm text-red-400">{error}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5"><button type="button" onClick={() => setConfirmDelete(!confirmDelete)} className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-xs text-red-400"><Trash2 className="h-4 w-4" /> Delete memory</button><button disabled={!items.length} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-studio-fill px-6 text-sm font-semibold text-black disabled:opacity-40">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {busy ? "Preparing media…" : "Save changes"}</button></div>
      {confirmDelete ? <div className="rounded-xl border border-red-400/30 p-4"><p className="text-sm text-red-400">Delete this memory, all its media, and its soundtrack permanently?</p><button type="button" onClick={remove} className="mt-3 min-h-11 rounded-full bg-red-600 px-5 text-sm text-[#fff]">Yes, delete permanently</button></div> : null}
    </fieldset>
  </form></div>;
}
