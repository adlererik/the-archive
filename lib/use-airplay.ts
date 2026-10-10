"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { mediaUrl, type ArchiveMedia } from "./archive";
import type { CastOptions } from "@/components/cast-provider";

type AirPlayVideo = HTMLVideoElement & {
  webkitShowPlaybackTargetPicker?: () => void;
  webkitCurrentPlaybackTargetIsWireless?: boolean;
};
type Selection = { items: ArchiveMedia[]; options: CastOptions; index: number };

export function supportsAirPlay() {
  return typeof document !== "undefined" && typeof (document.createElement("video") as AirPlayVideo).webkitShowPlaybackTargetPicker === "function";
}

// Erik Adler: one native transport player survives wall recycling and viewer closure.
// It sends media only, and leaves the existing Cast button and gallery untouched.
export function useAirPlay() {
  const player = useRef<AirPlayVideo | null>(null);
  const selection = useRef<Selection | null>(null);
  const playRequest = useRef(0);
  const [supported, setSupported] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState("");
  const [mode, setMode] = useState<"single" | "presentation" | null>(null);
  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState(false);

  const play = useCallback((video: AirPlayVideo) => {
    const request = ++playRequest.current;
    void video.play().catch((cause: unknown) => {
      if (request !== playRequest.current || !selection.current || !video.webkitCurrentPlaybackTargetIsWireless) return;
      if (cause instanceof Error && cause.name === "AbortError") return;
      setError("AirPlay could not start this media. Try Play on TV, or select your AirPlay device again.");
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
    video.muted = !video.webkitCurrentPlaybackTargetIsWireless;
    video.load(); setActiveId(media.id); setMode(presentation ? "presentation" : "single");
    setEnded(false); setPaused(false); setError("");
    return video;
  }, []);

  useEffect(() => {
    if (!supportsAirPlay()) return;
    const video = document.createElement("video") as AirPlayVideo;
    video.setAttribute("x-webkit-airplay", "allow"); video.playsInline = true;
    video.disableRemotePlayback = false; video.preload = "none";
    video.setAttribute("aria-hidden", "true"); video.tabIndex = -1;
    // Do not use display:none: Safari needs a live native media element for routing.
    Object.assign(video.style, { position: "fixed", left: "-2px", top: "-2px", width: "1px", height: "1px", opacity: "0", pointerEvents: "none" });
    player.current = video; document.body.appendChild(video); setSupported(true);
    const wirelessChanged = () => {
      const wireless = Boolean(video.webkitCurrentPlaybackTargetIsWireless && selection.current);
      setConnected(wireless);
      video.muted = !wireless;
      if (wireless) { setMode(selection.current!.options.mode || "single"); setActiveId(selection.current!.items[selection.current!.index].id); setError(""); play(video); }
      else { playRequest.current++; video.pause(); setMode(null); }
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
    const locallyLoaded = () => { if (!video.webkitCurrentPlaybackTargetIsWireless) video.pause(); };
    const playbackFailed = () => {
      if (selection.current) setError("This media could not be loaded for AirPlay. Check your connection and try again.");
    };
    video.addEventListener("webkitcurrentplaybacktargetiswirelesschanged", wirelessChanged);
    video.addEventListener("play", playbackChanged); video.addEventListener("pause", playbackChanged);
    video.addEventListener("ended", playbackEnded); video.addEventListener("error", playbackFailed);
    video.addEventListener("loadeddata", locallyLoaded);
    return () => {
      playRequest.current++; selection.current = null; player.current = null;
      video.removeEventListener("webkitcurrentplaybacktargetiswirelesschanged", wirelessChanged);
      video.removeEventListener("play", playbackChanged); video.removeEventListener("pause", playbackChanged);
      video.removeEventListener("ended", playbackEnded); video.removeEventListener("error", playbackFailed);
      video.removeEventListener("loadeddata", locallyLoaded);
      video.pause(); video.removeAttribute("src"); video.load(); video.remove();
    };
  }, [load, play]);

  const castItems = useCallback(async (items: ArchiveMedia[], options: CastOptions = {}) => {
    const video = player.current;
    if (!video?.webkitShowPlaybackTargetPicker || !items.length || items.length > 1000) return;
    const index = Math.max(0, Math.min(options.startIndex || 0, items.length - 1));
    const current = selection.current;
    const unchanged = current?.items[current.index].id === items[index].id && current.items[current.index].revision === items[index].revision && current.options.mode === options.mode;
    if (!unchanged) { selection.current = { items, options, index }; load(); }
    else if (current) { current.items = items; current.options = options; current.index = index; }
    setError("");
    try {
      // Erik Adler: no await before the native picker; preserve the original click gesture.
      // Automatic carousel updates already have a wireless target and must not reopen it.
      if (options.openPicker) video.webkitShowPlaybackTargetPicker();
      if (video.webkitCurrentPlaybackTargetIsWireless) { video.muted = false; setConnected(true); }
      play(video);
    } catch {
      setError("AirPlay is unavailable. Try again in Safari with an AirPlay TV on the same network.");
    }
  }, [load, play]);

  const stop = useCallback(() => {
    playRequest.current++; selection.current = null;
    const video = player.current;
    if (video) { video.pause(); video.muted = true; video.removeAttribute("src"); video.load(); }
    setConnected(false); setMode(null); setActiveId(""); setEnded(false); setError("");
  }, []);
  const togglePlayback = useCallback(() => {
    const video = player.current; if (!video || !selection.current) return;
    setError(""); if (video.paused || video.ended) { video.muted = false; play(video); } else { playRequest.current++; video.pause(); }
  }, [play]);
  const jump = useCallback((id: string) => {
    const current = selection.current; if (!current) return;
    const index = current.items.findIndex(item => item.id === id); if (index < 0) return;
    current.index = index; const video = load(); if (video) play(video);
  }, [load, play]);

  return { supported, connected, busy: false, reason: "Choose an AirPlay TV or speaker in Safari’s native device picker.", error, device: "AirPlay", mode, activeId, paused, ended, castItems, clearError: () => setError(""), stop, togglePlayback, jump };
}
