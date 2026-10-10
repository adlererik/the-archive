"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { mediaUrl, type ArchiveMedia } from "./archive";
import type { CastOptions } from "@/components/cast-provider";
import { claimAirPlayVideo, releaseAirPlayVideo, type AirPlayVideo } from "./airplay-player";
import { stopVideo } from "./video-playback";

type Selection = { items: ArchiveMedia[]; options: CastOptions; index: number };

export function supportsAirPlay() {
  return typeof document !== "undefined" && typeof (document.createElement("video") as AirPlayVideo).webkitShowPlaybackTargetPicker === "function";
}

// Erik Adler: prefer the actual playing video; retain that same element during AirPlay.
// A native transport is used only when there is no compatible displayed video.
export function useAirPlay() {
  const player = useRef<AirPlayVideo | null>(null);
  const fallback = useRef<AirPlayVideo | null>(null);
  const detach = useRef<() => void>(() => {});
  const bind = useRef<(video: AirPlayVideo) => void>(() => {});
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasWireless = useRef(false);
  const selection = useRef<Selection | null>(null);
  const playRequest = useRef(0);
  const playbackFailure = useRef<(wireless: boolean) => void>(() => {});
  const [supported, setSupported] = useState(false);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState("");
  const [mode, setMode] = useState<"single" | "presentation" | null>(null);
  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState(false);

  const play = useCallback((video: AirPlayVideo) => {
    const request = ++playRequest.current;
    void video.play().catch((cause: unknown) => {
      if (request !== playRequest.current || !selection.current) return;
      if (cause instanceof Error && cause.name === "AbortError") return;
      const wireless = Boolean(video.webkitCurrentPlaybackTargetIsWireless);
      playbackFailure.current(wireless);
      setError(wireless ? "AirPlay could not start this media. Try Play on TV, or select your AirPlay device again." : "Start the video with its Play control, then tap the Cast icon again to choose an AirPlay TV.");
      setPaused(true);
    });
  }, []);

  const load = useCallback(() => {
    const video = player.current; const current = selection.current;
    if (!video || !current) return;
    const media = current.items[current.index]; const presentation = current.options.mode === "presentation";
    const seconds = presentation ? current.options.photoSeconds || 6 : 30;
    const source = media.mediaType === "IMAGE" || media.hasSoundtrack
      ? "/api/cast/slides/" + encodeURIComponent(media.id) + "?seconds=" + seconds + "&revision=" + encodeURIComponent(media.revision || "")
      : mediaUrl(media.playbackFile || media.fileName);
    playRequest.current++; video.pause(); video.src = source;
    video.loop = !presentation && media.mediaType === "IMAGE";
    video.muted = false;
    video.load(); setActiveId(media.id); setMode(presentation ? "presentation" : "single");
    setEnded(false); setPaused(false); setError("");
    return video;
  }, []);

  const clearPending = useCallback(() => {
    if (pendingTimer.current) clearTimeout(pendingTimer.current);
    pendingTimer.current = null; setBusy(false);
  }, []);

  const stop = useCallback(() => {
    clearPending(); if (disconnectTimer.current) clearTimeout(disconnectTimer.current); disconnectTimer.current = null;
    playRequest.current++; selection.current = null; wasWireless.current = false;
    detach.current();
    const video = player.current;
    releaseAirPlayVideo();
    if (video) { video.pause(); video.muted = true; }
    if (fallback.current) { fallback.current.removeAttribute("src"); fallback.current.load(); }
    player.current = fallback.current;
    if (player.current) bind.current(player.current);
    setConnected(false); setMode(null); setActiveId(""); setEnded(false); setError("");
  }, [clearPending]);

  playbackFailure.current = wireless => { if (wireless) clearPending(); else stop(); };

  const watch = useCallback((video: AirPlayVideo) => {
    detach.current();
    const wirelessChanged = () => {
      const wireless = Boolean(video.webkitCurrentPlaybackTargetIsWireless && selection.current);
      if (wireless) {
        if (disconnectTimer.current) clearTimeout(disconnectTimer.current); disconnectTimer.current = null;
        wasWireless.current = true; clearPending(); setConnected(true);
        setMode(selection.current!.options.mode || "single"); setActiveId(selection.current!.items[selection.current!.index].id);
        video.muted = false; setError(""); play(video);
      } else if (wasWireless.current) {
        // Source changes can briefly clear the wireless flag while WebKit replaces its media engine.
        if (disconnectTimer.current) clearTimeout(disconnectTimer.current);
        disconnectTimer.current = setTimeout(() => { if (player.current === video && !video.webkitCurrentPlaybackTargetIsWireless) stop(); }, 1500);
      }
    };
    const playbackChanged = () => setPaused(video.paused);
    const playbackEnded = () => {
      const current = selection.current;
      if (!current || !video.webkitCurrentPlaybackTargetIsWireless) return;
      if (current.options.mode === "presentation" && (current.index + 1 < current.items.length || current.options.loop)) {
        current.index = (current.index + 1) % current.items.length;
        const next = load(); if (next) play(next);
      } else { setEnded(true); setPaused(true); }
    };
    const playbackFailed = () => {
      if (!selection.current) return;
      stop(); setError("This media could not be loaded for AirPlay. Check your connection and try again.");
    };
    video.addEventListener("webkitcurrentplaybacktargetiswirelesschanged", wirelessChanged);
    video.addEventListener("play", playbackChanged); video.addEventListener("pause", playbackChanged);
    video.addEventListener("ended", playbackEnded); video.addEventListener("error", playbackFailed);
    detach.current = () => {
      video.removeEventListener("webkitcurrentplaybacktargetiswirelesschanged", wirelessChanged);
      video.removeEventListener("play", playbackChanged); video.removeEventListener("pause", playbackChanged);
      video.removeEventListener("ended", playbackEnded); video.removeEventListener("error", playbackFailed);
    };
  }, [clearPending, load, play, stop]);
  bind.current = watch;

  useEffect(() => {
    if (!supportsAirPlay()) return;
    const video = document.createElement("video") as AirPlayVideo;
    video.setAttribute("x-webkit-airplay", "allow"); video.playsInline = true;
    video.disableRemotePlayback = false; video.preload = "auto";
    video.setAttribute("aria-hidden", "true"); video.tabIndex = -1;
    Object.assign(video.style, { position: "fixed", left: "0", top: "0", width: "1px", height: "1px", opacity: "0", pointerEvents: "none" });
    fallback.current = video; player.current = video; document.body.appendChild(video); watch(video); setSupported(true);
    return () => {
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
      if (disconnectTimer.current) clearTimeout(disconnectTimer.current);
      playRequest.current++; selection.current = null; detach.current(); releaseAirPlayVideo();
      player.current?.pause(); player.current = null; fallback.current = null;
      video.pause(); video.removeAttribute("src"); video.load(); video.remove();
    };
  }, [watch]);

  const castItems = useCallback(async (items: ArchiveMedia[], options: CastOptions = {}) => {
    if (!player.current?.webkitShowPlaybackTargetPicker || !items.length || items.length > 1000) return;
    const index = Math.max(0, Math.min(options.startIndex || 0, items.length - 1));
    const current = selection.current; const media = items[index];
    const unchanged = current?.items[current.index].id === media.id && current.items[current.index].revision === media.revision && current.options.mode === options.mode;
    // Erik Adler: Safari's picker must belong to the video the visitor is already watching.
    const displayed = options.airPlayVideo as AirPlayVideo | null | undefined;
    const useDisplayed = options.openPicker && !wasWireless.current && media.mediaType === "VIDEO" && !media.hasSoundtrack && typeof displayed?.webkitShowPlaybackTargetPicker === "function";
    if (useDisplayed && displayed && player.current !== displayed) {
      detach.current(); releaseAirPlayVideo();
      fallback.current?.pause();
      player.current = displayed; watch(displayed);
    }
    selection.current = { items, options, index };
    const video = player.current;
    if (!unchanged && !useDisplayed) load();
    if (useDisplayed) { setActiveId(media.id); setMode(options.mode || "single"); setEnded(false); video.loop = false; }
    video.setAttribute("x-webkit-airplay", "allow"); video.disableRemotePlayback = false;
    claimAirPlayVideo(video); stopVideo(video); // Release local playback ownership without pausing this player.
    video.muted = false; setError("");
    try {
      // Start unmuted playback BEFORE the picker, synchronously within the original tap.
      // Do not pause on loadeddata or visibility changes while the receiver is being selected.
      play(video);
      if (options.openPicker) {
        clearPending();
        if (!video.webkitCurrentPlaybackTargetIsWireless) {
          setBusy(true);
          pendingTimer.current = setTimeout(() => {
            if (!video.webkitCurrentPlaybackTargetIsWireless) {
              stop(); setError("No AirPlay TV was selected. Your TV must support AirPlay, have it enabled, and share this iPhone’s Wi-Fi network.");
            }
          }, 20000);
        }
        video.webkitShowPlaybackTargetPicker!();
      }
      if (video.webkitCurrentPlaybackTargetIsWireless) { wasWireless.current = true; clearPending(); setConnected(true); }
    } catch {
      stop(); setError("AirPlay is unavailable. Try again in Safari with an AirPlay TV on the same network.");
    }
  }, [clearPending, load, play, stop, watch]);

  const togglePlayback = useCallback(() => {
    const video = player.current; if (!video || !selection.current) return;
    setError(""); if (video.paused || video.ended) { video.muted = false; play(video); } else { playRequest.current++; video.pause(); }
  }, [play]);
  const jump = useCallback((id: string) => {
    const current = selection.current; if (!current) return;
    const index = current.items.findIndex(item => item.id === id); if (index < 0) return;
    current.index = index; const video = load(); if (video) play(video);
  }, [load, play]);

  return { supported, connected, busy, reason: "Choose an AirPlay-enabled TV on the same Wi-Fi. A Google Cast-only TV will not appear in Safari’s AirPlay picker.", error, device: "AirPlay", mode, activeId, paused, ended, castItems, clearError: () => setError(""), stop, togglePlayback, jump };
}
