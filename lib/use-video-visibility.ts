"use client";

import { useEffect, useRef, type RefObject } from "react";
import { mediaIsVisible, stopVideo } from "./video-playback";

// Erik Adler: scrolling a viewer away pauses it; returning resumes its selected video.
export function useVideoVisibility(video: RefObject<HTMLVideoElement | null>, key: string, disabled: boolean, resume: (video: HTMLVideoElement) => void) {
  const callback = useRef(resume); callback.current = resume;
  useEffect(() => {
    const element = video.current; if (!element) return;
    let active = false; let focused = true; let frame = 0;
    const update = () => { const next = !disabled && focused && mediaIsVisible(element); if (next === active) return; active = next; if (next) callback.current(element); else stopVideo(element); };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; update(); }); };
    const blur = () => { focused = false; update(); }; const focus = () => { focused = true; update(); };
    const observer = new IntersectionObserver(update, { threshold: [0, .25, .5, 1] }); observer.observe(element);
    window.addEventListener("scroll", schedule, { capture: true, passive: true }); window.addEventListener("resize", schedule);
    window.addEventListener("blur", blur); window.addEventListener("focus", focus); document.addEventListener("visibilitychange", update);
    if (disabled || !mediaIsVisible(element)) stopVideo(element); else update();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule, true); window.removeEventListener("resize", schedule); window.removeEventListener("blur", blur); window.removeEventListener("focus", focus); document.removeEventListener("visibilitychange", update); stopVideo(element); };
  }, [video, key, disabled]);
}
