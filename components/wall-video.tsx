"use client";

import { useLayoutEffect, useRef } from "react";
import { soundIsEnabled } from "@/lib/sound-preference";
import { stopVideo } from "@/lib/video-playback";

// Erik Adler: reuse the actual media element, retaining browser playback permission across wall items.
let player: HTMLVideoElement | null = null;
let host: HTMLDivElement | null = null;

export function WallVideo({ src, poster, desktop, attach, onPlay, onAudible }: {
  src: string;
  poster?: string;
  desktop: boolean;
  attach: (video: HTMLVideoElement | null) => void;
  onPlay: (video: HTMLVideoElement) => void;
  onAudible: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const target = container.current;
    if (!target) return;
    const video = player ??= document.createElement("video");
    stopVideo(video);
    host = target;
    video.controls = !desktop;
    video.playsInline = true;
    video.setAttribute("webkit-playsinline", "true");
    video.loop = true;
    video.preload = "auto";
    video.muted = !soundIsEnabled();
    video.className = desktop ? "h-full w-full object-cover" : "h-full w-full object-contain";
    if (video.getAttribute("src") !== src) video.setAttribute("src", src);
    if (poster) video.poster = poster; else video.removeAttribute("poster");
    const played = () => onPlay(video);
    const volumeChanged = () => { if (!video.muted && video.volume > 0) onAudible(); };
    video.addEventListener("play", played);
    video.addEventListener("volumechange", volumeChanged);
    target.appendChild(video);
    attach(video);
    return () => {
      video.removeEventListener("play", played);
      video.removeEventListener("volumechange", volumeChanged);
      if (host !== target) return;
      attach(null);
      video.remove();
      host = null;
    };
  }, [src, poster, desktop, attach, onPlay, onAudible]);
  return <div ref={container} className="h-full w-full" />;
}
