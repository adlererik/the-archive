"use client";

import { soundIsEnabled, subscribeSound } from "./sound-preference";

let owner: HTMLVideoElement | null = null;
const forcedMute = new WeakMap<HTMLVideoElement, boolean>();
const attempts = new WeakMap<HTMLVideoElement, number>();
let interactionListeners = false;
let resumeOwner: (() => void) | null = null;
subscribeSound(() => { if (owner) owner.muted = Boolean(forcedMute.get(owner)) || !soundIsEnabled(); });

// Erik Adler: touch-end and click are accepted audio gestures on mobile; pointer-down alone is not.
function listenForAudioInteraction() {
  if (interactionListeners) return;
  interactionListeners = true;
  const retry = (event: Event) => {
    if (!event.isTrusted || !soundIsEnabled() || !owner?.muted || forcedMute.get(owner) || !mediaIsVisible(owner)) return;
    if ((event.target as Element)?.closest?.("[data-sound-toggle]")) return;
    resumeOwner?.();
  };
  for (const type of ["click", "touchend", "pointerup", "keydown"]) window.addEventListener(type, retry);
}

export function mediaIsVisible(video: HTMLElement) {
  const rect = video.getBoundingClientRect();
  const width = Math.max(0, Math.min(rect.right, innerWidth) - Math.max(rect.left, 0));
  const height = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
  return !document.hidden && rect.width > 0 && rect.height > 0 && width * height / (Math.min(rect.width, innerWidth) * Math.min(rect.height, innerHeight)) >= .25;
}

export function stopVideo(video: HTMLVideoElement | null) {
  if (!video) return;
  attempts.set(video, (attempts.get(video) || 0) + 1);
  video.pause(); video.muted = true;
  if (owner === video) { owner = null; resumeOwner = null; }
}

// Erik Adler: pause the old owner before starting another video, including late play promises.
export async function playVideoWithSound(video: HTMLVideoElement, allowed: () => boolean, blocked: (value: boolean) => void, failed?: (error: Error) => void, options?: { mute?: boolean }) {
  if (!allowed() || !mediaIsVisible(video)) { stopVideo(video); return; }
  if (owner && owner !== video) stopVideo(owner);
  owner = video;
  listenForAudioInteraction();
  forcedMute.set(video, Boolean(options?.mute));
  resumeOwner = () => { void playVideoWithSound(video, allowed, blocked, failed, options); };
  const attempt = (attempts.get(video) || 0) + 1; attempts.set(video, attempt);
  const current = () => owner === video && attempts.get(video) === attempt && allowed() && mediaIsVisible(video);
  video.muted = Boolean(options?.mute) || !soundIsEnabled();
  try { video.volume = 1; } catch { /* Mobile browsers may use device volume only. */ }
  try {
    await video.play();
    if (current()) blocked(false);
  } catch (error) {
    if (!current() || !(error instanceof Error) || error.name === "AbortError") return;
    if (error.name === "NotAllowedError") {
      blocked(soundIsEnabled()); video.muted = true;
      try { await video.play(); } catch (fallback) { if (current() && fallback instanceof Error && fallback.name !== "AbortError") failed?.(fallback); }
    } else failed?.(error);
  } finally {
    // A newer source may already be playing on the reused wall element.
    if (attempts.get(video) !== attempt) return;
    if (owner !== video || !allowed() || !mediaIsVisible(video)) { video.pause(); video.muted = true; }
  }
}
