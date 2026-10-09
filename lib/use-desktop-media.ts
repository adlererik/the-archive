"use client";

import { useSyncExternalStore } from "react";

const condition = "(min-width: 480px) and (hover: hover) and (pointer: fine)";
let query: MediaQueryList | null = null;
function mediaQuery() { return query ??= window.matchMedia(condition); }
function subscribe(listener: () => void) { const value = mediaQuery(); value.addEventListener("change", listener); return () => value.removeEventListener("change", listener); }
function desktop() { return mediaQuery().matches; }

// Erik Adler: touch and compact layouts display inline media, without a theater-opening target.
export function useDesktopMedia() { return useSyncExternalStore(subscribe, desktop, () => false); }
