"use client";

import { CheckCircle2, ImagePlus, LoaderCircle, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";

const supported = ["video/mp4", "video/quicktime", "image/jpeg", "image/png", "image/webp"];

function localDateTime() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export function AdminUploader() {
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [takenAt, setTakenAt] = useState(localDateTime);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null);

  function addFiles(next: FileList | File[]) {
    const acceptable = Array.from(next).filter((file) => supported.includes(file.type) || /\.(mp4|mov|jpe?g|png|webp)$/i.test(file.name));
    setFiles((current) => [...current, ...acceptable]);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!files.length) { setMessage("Choose one or more media files first."); return; }
    setBusy(true); setMessage("");
    const form = new FormData();
    form.set("caption", caption); form.set("takenAt", new Date(takenAt).toISOString());
    files.forEach((file) => form.append("files", file));
    try {
      const response = await fetch("/api/admin/posts", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");
      setFiles([]); setCaption(""); setTakenAt(localDateTime()); setMessage("Memory added to The Archive.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload failed"); }
    finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="rounded-[1.5rem] border border-white/[0.09] bg-white/[0.035] p-5 backdrop-blur-xl sm:p-8">
    <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }} onClick={() => input.current?.click()} className={"cursor-pointer rounded-2xl border border-dashed p-10 text-center transition sm:p-16 " + (dragging ? "border-[#d4af37] bg-studio-fill/10" : "border-white/20 bg-black/20 hover:border-[#d4af37]/60")}>
      <input ref={input} type="file" accept=".mp4,.mov,.jpg,.jpeg,.png,.webp" multiple className="hidden" onChange={(event) => event.target.files && addFiles(event.target.files)} />
      <UploadCloud className="mx-auto h-10 w-10 text-studio-accent" />
      <p className="mt-4 font-editorial text-2xl text-white">Drop the next memory here</p>
      <p className="mt-2 text-sm text-white/50">MP4, MOV, JPG, JPEG, PNG, or WEBP · add several files for a carousel</p>
    </div>

    {files.length ? <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3"><div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[.15em] text-white/50"><span>{files.length} item{files.length === 1 ? "" : "s"} selected</span><button type="button" onClick={() => setFiles([])} className="text-white/70 hover:text-white">Clear</button></div><div className="max-h-36 space-y-1 overflow-y-auto pr-1">{files.map((file, index) => <div key={file.name + index} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm text-white/75"><span className="min-w-0 truncate">{file.name}</span><button type="button" onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="shrink-0 text-white/45 hover:text-red-300" aria-label={"Remove " + file.name}><X className="h-4 w-4" /></button></div>)}</div></div> : null}

    <div className="mt-6 grid gap-5 sm:grid-cols-2">
      <label className="block text-sm text-white/75">Date and time<input type="datetime-local" required value={takenAt} onChange={(event) => setTakenAt(event.target.value)} className="mt-2 block w-full rounded-xl border border-white/15 bg-black/40 px-3 py-3 text-white outline-none focus:border-[#d4af37]" /></label>
      <label className="block text-sm text-white/75">Caption<textarea rows={3} value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Tell this memory's story…" className="mt-2 block w-full resize-y rounded-xl border border-white/15 bg-black/40 px-3 py-3 text-white outline-none placeholder:text-white/25 focus:border-[#d4af37]" /></label>
    </div>
    {message ? <p className={"mt-5 flex items-center gap-2 text-sm " + (message === "Memory added to The Archive." ? "text-emerald-300" : "text-red-300")}>{message === "Memory added to The Archive." ? <CheckCircle2 className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}{message}</p> : null}
    <div className="mt-7 flex justify-end"><button disabled={busy || !files.length} className="flex min-w-40 items-center justify-center gap-2 rounded-full bg-studio-fill px-6 py-3 text-sm font-bold text-black transition hover:bg-studio-hover disabled:cursor-not-allowed disabled:opacity-40">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />} Save to archive</button></div>
  </form>;
}
