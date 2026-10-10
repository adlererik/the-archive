"use client";

import { ArrowLeft, ArrowRight, GripVertical, ImagePlus, Play, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { mediaUrl, type ArchiveMedia } from "@/lib/archive";

export type MediaDraft = { key: string; media?: ArchiveMedia; file?: File };
export function draftFiles(items: MediaDraft[]) { return items.filter(item => item.file).map(item => item.file!); }
export function draftOrder(items: MediaDraft[]) { let index = 0; return items.map(item => item.media?.id || "new:" + index++); }

function Preview({ item }: { item: MediaDraft }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!item.file) return;
    const next = URL.createObjectURL(item.file); setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [item.file]);
  const video = item.media?.mediaType === "VIDEO" || /\.(mp4|mov)$/i.test(item.file?.name || "");
  const src = item.media ? mediaUrl(item.media.thumbnail || item.media.fileName) : url;
  return <div className="media-surface relative aspect-[4/5] overflow-hidden rounded-xl bg-zinc-950">{video && !item.media?.thumbnail ? <video src={src} muted preload="metadata" playsInline className="h-full w-full object-cover" /> : <img src={src} alt="" className="h-full w-full object-cover" />}{video ? <Play className="absolute bottom-2 left-2 h-4 w-4 fill-white text-white drop-shadow" /> : null}</div>;
}

export function MediaEditor({ items, onChange }: { items: MediaDraft[]; onChange: (items: MediaDraft[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const dragged = useRef<string | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [removed, setRemoved] = useState<{ item: MediaDraft; index: number } | null>(null);
  function add(files: FileList | File[]) {
    const next = Array.from(files);
    if (next.some(file => !/\.(mp4|mov|jpe?g|png|webp)$/i.test(file.name))) { setError("Choose JPG, PNG, WebP, MP4, or MOV files. Add audio in Soundtrack below."); return; }
    if (items.filter(item => item.file).length + next.length > 100) { setError("Add up to 100 new files per save. Save this batch before adding more."); return; }
    if (items.length + next.length > 200) { setError("A memory can have up to 200 items."); return; }
    setError(""); onChange([...items, ...next.map(file => ({ key: crypto.randomUUID(), file }))]);
  }
  function move(from: number, to: number) {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items]; const [item] = next.splice(from, 1); next.splice(to, 0, item); onChange(next);
  }
  return <section aria-label="Carousel media editor">
    <div className="mb-3 flex items-end justify-between gap-4"><div><h3 className="font-editorial text-2xl">The sequence</h3><p className="mt-1 text-xs leading-relaxed text-white/55">{items.length} item{items.length === 1 ? "" : "s"} · drag to reorder, or use the move buttons</p></div><button type="button" onClick={() => input.current?.click()} className="studio-chip inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-xs"><ImagePlus className="h-4 w-4" /> Add media</button></div>
    <input ref={input} type="file" accept=".mp4,.mov,.jpg,.jpeg,.png,.webp" multiple className="hidden" onChange={event => { if (event.target.files) add(event.target.files); event.target.value = ""; }} />
    <div onDragOver={event => { if (dragged.current) return; event.preventDefault(); setDragging(true); }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={event => { if (dragged.current) return; event.preventDefault(); setDragging(false); if (event.dataTransfer.files.length) add(event.dataTransfer.files); }} className={"rounded-2xl border p-3 transition " + (dragging ? "border-studio-accent bg-studio-fill/10" : "border-white/10 bg-white/[.025]")}>
      {items.length ? <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{items.map((item, index) => <li key={item.key} draggable onDragStart={event => { dragged.current = item.key; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", item.key); }} onDragEnd={() => { dragged.current = null; }} onDragOver={event => { if (dragged.current) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; } }} onDrop={event => { if (!dragged.current) return; event.preventDefault(); event.stopPropagation(); move(items.findIndex(i => i.key === dragged.current), index); dragged.current = null; }} className="rounded-xl border border-white/10 bg-white/[.025] p-2">
        <div className="mb-2 flex items-center justify-between text-xs text-white/55"><span className="flex items-center gap-1"><GripVertical className="h-3 w-3" /> {String(index + 1).padStart(2, "0")}</span>{item.file ? <span className="text-studio-soft">New</span> : null}</div>
        <Preview item={item} />
        <p title={item.file?.name || item.media?.originalName} className="mt-2 truncate text-xs text-white/70">{item.file?.name || item.media?.originalName}</p>
        <div className="mt-2 flex items-center justify-between gap-1"><button type="button" disabled={index === 0} onClick={() => move(index, index - 1)} aria-label={"Move item " + (index + 1) + " earlier"} className="grid h-10 w-10 place-items-center rounded-lg hover:bg-white/10 disabled:opacity-20"><ArrowLeft className="h-4 w-4" /></button><button type="button" onClick={() => { setRemoved({ item, index }); onChange(items.filter(i => i.key !== item.key)); }} aria-label={"Remove item " + (index + 1)} className="grid h-10 w-10 place-items-center rounded-lg text-red-400 hover:bg-red-400/10"><Trash2 className="h-4 w-4" /></button><button type="button" disabled={index === items.length - 1} onClick={() => move(index, index + 1)} aria-label={"Move item " + (index + 1) + " later"} className="grid h-10 w-10 place-items-center rounded-lg hover:bg-white/10 disabled:opacity-20"><ArrowRight className="h-4 w-4" /></button></div>
      </li>)}</ol> : <button type="button" onClick={() => input.current?.click()} className="w-full rounded-xl border border-dashed border-white/20 py-12 text-center"><ImagePlus className="mx-auto h-8 w-8 text-studio-accent" /><span className="mt-3 block font-editorial text-2xl">Begin a memory</span><span className="mt-2 block text-xs text-white/50">Drop photos or videos here, or choose files</span></button>}
      {items.length ? <p className="mt-3 text-center text-xs text-white/45">Drop more files here to extend this memory.</p> : null}
    </div>
    {removed ? <p className="mt-2 text-xs text-white/60">Item removed from this draft. <button type="button" className="text-studio-accent underline" onClick={() => { const next = [...items]; next.splice(Math.min(removed.index, next.length), 0, removed.item); onChange(next); setRemoved(null); }}>Undo</button></p> : null}
    {error ? <p role="alert" className="mt-3 text-sm text-red-400">{error}</p> : null}
  </section>;
}
