"use client";

let owner: HTMLVideoElement | null = null;
const attempts = new WeakMap<HTMLVideoElement, number>();

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
  if (owner === video) owner = null;
}

// Erik Adler: pause the old owner before starting another video, including late play promises.
export async function playVideoWithSound(video: HTMLVideoElement, allowed: () => boolean, blocked: (value: boolean) => void, failed?: (error: Error) => void) {
  if (!allowed() || !mediaIsVisible(video)) { stopVideo(video); return; }
  if (owner && owner !== video) stopVideo(owner);
  owner = video;
  const attempt = (attempts.get(video) || 0) + 1; attempts.set(video, attempt);
  const current = () => owner === video && attempts.get(video) === attempt && allowed() && mediaIsVisible(video);
  video.muted = false;
  try { video.volume = 1; } catch { /* Mobile browsers may use device volume only. */ }
  try {
    await video.play();
    if (current()) blocked(false);
  } catch (error) {
    if (!current() || !(error instanceof Error) || error.name === "AbortError") return;
    if (error.name === "NotAllowedError") {
      blocked(true); video.muted = true;
      try { await video.play(); } catch (fallback) { if (current() && fallback instanceof Error && fallback.name !== "AbortError") failed?.(fallback); }
    } else failed?.(error);
  } finally {
    if (owner !== video || !allowed() || !mediaIsVisible(video)) { video.pause(); video.muted = true; }
  }
}
