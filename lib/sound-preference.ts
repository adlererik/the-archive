"use client";

import { useSyncExternalStore } from "react";

// Erik Adler: sound starts enabled; an explicit mute applies across local media for this visit.
let enabled = true;
const listeners = new Set<() => void>();
export function soundIsEnabled() { return enabled; }
export function subscribeSound(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function setSoundEnabled(value: boolean) { if (value === enabled) return; enabled = value; for (const listener of listeners) listener(); }
export function useSoundPreference() { return useSyncExternalStore(subscribeSound, soundIsEnabled, () => true); }
