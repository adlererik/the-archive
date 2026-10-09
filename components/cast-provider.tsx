"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ArchiveMedia } from "@/lib/archive";
import { mediaUrl } from "@/lib/archive";
import { castWindow, type CastContext, type RemoteController, type RemotePlayer } from "@/lib/cast-sdk";

export type CastOptions = { mode?: "single" | "presentation"; photoSeconds?: number; loop?: boolean; startIndex?: number };
type State = { ready: boolean; available: boolean; connected: boolean; busy: boolean; reason: string; error: string; device: string; mode: "single" | "presentation" | null; activeId: string; paused: boolean; ended: boolean; castItems: (items: ArchiveMedia[], options?: CastOptions) => Promise<void>; stop: () => void; togglePlayback: () => void; jump: (id: string) => void };
const Context = createContext<State | null>(null);
export function CastProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false); const [available, setAvailable] = useState(false); const [connected, setConnected] = useState(false); const [busy, setBusy] = useState(false); const [reason, setReason] = useState("Checking casting availability…"); const [error, setError] = useState(""); const [device, setDevice] = useState(""); const [mode, setMode] = useState<State["mode"]>(null); const [activeId, setActiveId] = useState(""); const [paused, setPaused] = useState(false); const [ended, setEnded] = useState(false);
  const context = useRef<CastContext | null>(null); const controller = useRef<RemoteController | null>(null); const remote = useRef<RemotePlayer | null>(null); const epoch = useRef(0); const last = useRef<{ id: string; loop: boolean } | null>(null); const origin = useRef<string | null>(null);
  useEffect(() => {
    if (!window.isSecureContext) { setReady(true); setReason("Google Cast requires Chrome and HTTPS. Open the archive's HTTPS address to connect to a TV."); return; }
    const sdk = castWindow(); let cleanup = () => {}; let disposed = false;
    const initialize = (supported: boolean) => {
      if (disposed) return;
      if (!supported || !sdk.cast?.framework || !sdk.chrome?.cast) { setReady(true); setReason("Use a Google Cast-supported Chrome browser with a Chromecast or Google TV on the same network."); return; }
      try {
      const framework = sdk.cast.framework; const ctx = framework.CastContext.getInstance(); context.current = ctx;
      ctx.setOptions({ receiverApplicationId: sdk.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID, autoJoinPolicy: sdk.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED });
      const player = new framework.RemotePlayer(); const controls = new framework.RemotePlayerController(player); remote.current = player; controller.current = controls;
      const changed = () => {
        const session = ctx.getCurrentSession(); const state = ctx.getCastState(); setReady(true); setAvailable(state !== "NO_DEVICES_AVAILABLE"); setConnected(Boolean(session)); setDevice(session?.getCastDevice().friendlyName || ""); setPaused(player.isPaused);
        setReason(state === "NO_DEVICES_AVAILABLE" ? "No Google Cast device was found. Check that Chrome and your TV are on the same network." : "Cast only this photo or video to your TV.");
        const media = session?.getMediaSession(); const data = media?.media?.customData;
        if (data?.archiveMediaId) { setActiveId(data.archiveMediaId); setMode(data.archiveMode); setEnded(media?.playerState === "IDLE" && media.idleReason === "FINISHED" && !media.loadingItemId && last.current?.id === data.archiveMediaId && !last.current.loop); }
        if (!session) { setActiveId(""); setMode(null); setEnded(false); }
      };
      ctx.addEventListener(framework.CastContextEventType.CAST_STATE_CHANGED, changed); ctx.addEventListener(framework.CastContextEventType.SESSION_STATE_CHANGED, changed); controls.addEventListener(framework.RemotePlayerEventType.ANY_CHANGE, changed); changed();
      cleanup = () => { ctx.removeEventListener(framework.CastContextEventType.CAST_STATE_CHANGED, changed); ctx.removeEventListener(framework.CastContextEventType.SESSION_STATE_CHANGED, changed); controls.removeEventListener(framework.RemotePlayerEventType.ANY_CHANGE, changed); };
      } catch { context.current = null; setReady(true); setAvailable(false); setReason("Google Cast is unavailable in this browser. Use Chrome on an HTTPS archive address."); }
    };
    sdk.__onGCastApiAvailable = initialize;
    if (sdk.cast?.framework) initialize(true);
    else if (!document.getElementById("archive-google-cast-sdk")) { const script = document.createElement("script"); script.id = "archive-google-cast-sdk"; script.src = "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"; script.async = true; script.onerror = () => { if (!disposed) { setReady(true); setReason("Google Cast could not load. Check your connection and try Chrome."); } }; document.head.appendChild(script); }
    const timeout = setTimeout(() => { if (!context.current && !disposed) { setReady(true); setReason("Google Cast is unavailable in this browser. Use Chrome on an HTTPS archive address."); } }, 15000);
    return () => { disposed = true; clearTimeout(timeout); cleanup(); if (sdk.__onGCastApiAvailable === initialize) delete sdk.__onGCastApiAvailable; };
  }, []);
  const castItems = useCallback(async (items: ArchiveMedia[], options: CastOptions = {}) => {
    const ctx = context.current; const sdk = castWindow().chrome?.cast; if (!ctx || !sdk || !items.length || items.length > 1000) return;
    const requestId = ++epoch.current; setError(""); setBusy(true); setEnded(false);
    try {
      // Erik Adler: request the device dialog directly from the user's click.
      if (!ctx.getCurrentSession()) await ctx.requestSession(); const session = ctx.getCurrentSession(); if (!session) throw new Error("No TV was selected.");
      if (!origin.current) { const response = await fetch("/api/cast/config"); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Casting origin is unavailable."); origin.current = result.mediaOrigin; }
      const kind = options.mode || "single"; const seconds = kind === "single" ? 30 : options.photoSeconds || 6; const queue = [];
      for (const media of items) {
        if (epoch.current !== requestId || ctx.getCurrentSession() !== session) return;
        let resource = mediaUrl(media.playbackFile || media.fileName);
        if (media.mediaType === "IMAGE") { resource = "/api/cast/slides/" + encodeURIComponent(media.id) + "?seconds=" + seconds; const response = await fetch(resource, { method: "POST" }); if (!response.ok) throw new Error("Unable to prepare a photo for your TV. Try again."); }
        const info = new sdk.media.MediaInfo(new URL(resource, origin.current!).href, "video/mp4"); info.customData = { archiveMediaId: media.id, archiveMode: kind }; if (media.mediaType === "IMAGE") info.duration = seconds;
        const item = new sdk.media.QueueItem(info); item.autoplay = true; item.preloadTime = 2; queue.push(item);
      }
      if (epoch.current !== requestId || ctx.getCurrentSession() !== session) return;
      const index = Math.max(0, Math.min(options.startIndex || 0, queue.length - 1)); const repeat = kind === "single" && items[0].mediaType === "IMAGE" ? sdk.media.RepeatMode.SINGLE : options.loop ? sdk.media.RepeatMode.ALL : sdk.media.RepeatMode.OFF;
      const data = new sdk.media.QueueData(); data.items = queue; data.startIndex = index; data.repeatMode = repeat; const load = new sdk.media.LoadRequest(queue[index].media); load.autoplay = true; load.queueData = data;
      await session.loadMedia(load); if (epoch.current !== requestId) return;
      last.current = { id: items.at(-1)!.id, loop: Boolean(options.loop) || repeat === sdk.media.RepeatMode.SINGLE }; setConnected(true); setMode(kind); setActiveId(items[index].id); setDevice(session.getCastDevice().friendlyName || "your TV"); setPaused(false);
    } catch (e) { if (epoch.current === requestId) { const code = typeof e === "object" && e !== null && "code" in e ? String(e.code) : ""; if (code !== "cancel") setError(e instanceof Error ? e.message : "Casting could not start. Check that the TV can reach your archive address."); } }
    finally { if (epoch.current === requestId) setBusy(false); }
  }, []);
  const stop = useCallback(() => { epoch.current++; setBusy(false); context.current?.getCurrentSession()?.endSession(true); setMode(null); setActiveId(""); setConnected(false); }, []);
  const jump = useCallback((id: string) => { const media = context.current?.getCurrentSession()?.getMediaSession(); const item = media?.items?.find(item => item.media.customData?.archiveMediaId === id); if (item?.itemId != null) media?.queueJumpToItem(item.itemId, () => setActiveId(id), () => setError("Unable to switch the TV to this item.")); }, []);
  const togglePlayback = useCallback(() => controller.current?.playOrPause(), []);
  return <Context.Provider value={{ ready, available, connected, busy, reason, error, device, mode, activeId, paused, ended, castItems, stop, togglePlayback, jump }}>{children}<div role="status" className="sr-only">{busy ? "Preparing media for casting" : error}</div>{connected && mode ? <aside aria-label="Casting controls" className="fixed bottom-4 left-4 right-4 z-40 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d4af37]/40 bg-black/95 px-4 py-3 text-sm text-studio-soft shadow-2xl sm:left-auto sm:max-w-lg"><span>On {device || "your TV"}</span><div className="flex gap-2"><button onClick={togglePlayback} className="min-h-11 rounded-full border border-white/20 px-3">{paused ? "Play on TV" : "Pause on TV"}</button><button onClick={stop} className="min-h-11 rounded-full border border-[#d4af37]/40 px-3">Stop casting</button></div></aside> : null}</Context.Provider>;
}
export function useCast() { const value = useContext(Context); if (!value) throw new Error("CastProvider is required"); return value; }
