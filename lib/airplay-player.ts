"use client";

export type AirPlayVideo = HTMLVideoElement & {
  webkitShowPlaybackTargetPicker?: () => void;
  webkitCurrentPlaybackTargetIsWireless?: boolean;
};

let owned: HTMLVideoElement | null = null;
let observer: MutationObserver | null = null;
let originalStyle: string | null = null;
let parked = false;

export function isAirPlayOwnedVideo(video: HTMLVideoElement | null) {
  return Boolean(video && video === owned);
}

// Erik Adler: retain the same native player if React or wall virtualization removes it.
export function parkAirPlayVideo(video: HTMLVideoElement) {
  if (!isAirPlayOwnedVideo(video)) return;
  parked = true; video.setAttribute("aria-hidden", "true"); video.tabIndex = -1;
  Object.assign(video.style, { position: "fixed", left: "0", top: "0", width: "1px", height: "1px", opacity: "0", pointerEvents: "none" });
  document.body.appendChild(video);
}

export function claimAirPlayVideo(video: HTMLVideoElement) {
  if (owned === video) return;
  releaseAirPlayVideo();
  owned = video; originalStyle = video.getAttribute("style"); parked = false;
  observer = new MutationObserver(() => {
    if (owned && !owned.isConnected) parkAirPlayVideo(owned);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

export function releaseAirPlayVideo() {
  observer?.disconnect(); observer = null;
  const video = owned; owned = null;
  if (!video) return;
  if (originalStyle === null) video.removeAttribute("style"); else video.setAttribute("style", originalStyle);
  if (parked) video.remove();
  parked = false; originalStyle = null;
}
