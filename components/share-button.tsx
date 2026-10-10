"use client";
import { Copy, LoaderCircle, Mail, MessageCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useModal } from "@/lib/use-modal";

type Props = { ids: string[]; kind?: "media" | "presentation"; seconds?: number; loop?: boolean; overlay?: boolean; compact?: boolean; title?: string; disabled?: boolean; onMenuOpenChange?: (open: boolean) => void };
export function ShareButton(props: Props) {
  const [open, setOpen] = useState(false);
  useEffect(() => { props.onMenuOpenChange?.(open); }, [open, props.onMenuOpenChange]);
  return <><button type="button" disabled={props.disabled} onClick={event => { event.stopPropagation(); setOpen(true); }} aria-label={props.kind === "presentation" ? "Send presentation" : "Send this photo or video"} title="Send to" className={(props.overlay ? "media-overlay-button" : "gallery-icon-button") + " disabled:opacity-40"}><Send aria-hidden="true" className={props.overlay ? "h-4 w-4" : "h-5 w-5"} strokeWidth={1.6} />{!props.overlay && !props.compact ? <span className="ml-2 text-sm">Send to</span> : null}</button>{open ? createPortal(<ShareMenu {...props} onClose={() => setOpen(false)} />, document.body) : null}</>;
}
function ShareMenu({ ids, kind = "media", seconds = 6, loop = true, title = "A memory for you", onClose }: Props & { onClose: () => void }) {
  const modal = useModal(onClose);
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(""); const [error, setError] = useState(""); const [status, setStatus] = useState(""); const [native, setNative] = useState(false); const [sms, setSms] = useState("sms:?body=");
  const selection = JSON.stringify({ ids, kind, seconds, loop });
  useEffect(() => {
    setNative(typeof navigator.share === "function" && window.isSecureContext);
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) setSms("sms:&body=");
    const controller = new AbortController();
    fetch("/api/share", { method: "POST", headers: { "Content-Type": "application/json" }, body: selection, signal: controller.signal }).then(async response => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to prepare this link.");
      setUrl(new URL(data.url, window.location.origin).href);
    }).catch(error => { if (error.name !== "AbortError") setError(error.message || "Unable to prepare this link."); });
    return () => controller.abort();
  }, [selection]);
  async function copy() {
    try { await navigator.clipboard.writeText(url); setStatus("Link copied."); }
    catch { input.current?.focus(); input.current?.select(); setStatus("Select and copy the link above."); }
  }
  function share() {
    void navigator.share({ title, url }).catch(error => { if (error.name !== "AbortError") setStatus("Use Copy link, Email, or Message below."); });
  }
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/65 p-4 backdrop-blur-sm" onClick={event => { if (event.target === event.currentTarget) onClose(); }}><div ref={modal} role="dialog" aria-modal="true" aria-label="Send to" tabIndex={-1} className="studio-panel w-full max-w-sm rounded-2xl border border-white/15 p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="font-editorial text-3xl">Send to</h2><button onClick={onClose} aria-label="Close sharing menu" className="gallery-icon-button"><X className="h-5 w-5" /></button></div><p className="mt-2 text-sm text-white/55">{kind === "presentation" ? "One link plays this selection in its current order. No sign-in needed." : "A direct link to this photo or video. No sign-in needed."}</p>{error ? <p role="alert" className="mt-4 text-sm text-studio-soft">{error}</p> : !url ? <p role="status" className="mt-6 flex items-center gap-2 text-sm text-white/60"><LoaderCircle className="h-4 w-4 animate-spin" /> Preparing link…</p> : <><input ref={input} aria-label="Direct share link" value={url} readOnly onFocus={event => event.currentTarget.select()} className="mt-5 min-h-11 w-full rounded-lg border border-white/15 bg-transparent px-3 text-sm text-white/80" /><div className="mt-4 grid gap-2">{native ? <button onClick={share} className="flex min-h-12 items-center gap-3 rounded-xl bg-studio-fill px-4 text-sm font-semibold text-black"><Send className="h-5 w-5" /> Share with your apps</button> : null}<button onClick={copy} className="flex min-h-12 items-center gap-3 rounded-xl border border-white/15 px-4 text-sm"><Copy className="h-5 w-5" /> Copy link</button><a href={"mailto:?subject=" + encodeURIComponent(title) + "&body=" + encodeURIComponent(url)} className="flex min-h-12 items-center gap-3 rounded-xl border border-white/15 px-4 text-sm"><Mail className="h-5 w-5" /> Email</a><a href={sms + encodeURIComponent(url)} className="flex min-h-12 items-center gap-3 rounded-xl border border-white/15 px-4 text-sm"><MessageCircle className="h-5 w-5" /> Message</a></div></>}<p role="status" className="mt-3 text-sm text-studio-soft">{status}</p></div></div>;
}
