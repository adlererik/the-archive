"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

type Entry = { node: HTMLElement; enabled: boolean; video: boolean; active: boolean; hovered: boolean; point: { x: number; y: number } | null; change: (active: boolean) => void };
const entries = new Map<Element, Entry>();
const visible = new Set<Entry>();
let selected: Entry | null = null;
let requested: Entry | null = null;
let observer: IntersectionObserver | null = null;
let frame = 0;
let focused = true;

function select() {
  let next: Entry | null = null; let score = -Infinity;
  if (!document.hidden && focused) for (const entry of visible) {
    if (!entry.enabled) continue;
    const rect = entry.node.getBoundingClientRect();
    const width = Math.max(0, Math.min(rect.right, innerWidth) - Math.max(rect.left, 0));
    const height = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
    const fraction = width * height / (Math.min(rect.width, innerWidth) * Math.min(rect.height, innerHeight));
    if (!Number.isFinite(fraction) || fraction < .25) continue;
    const hovered = entry.hovered && entry.point && entry.point.x >= rect.left && entry.point.x <= rect.right && entry.point.y >= rect.top && entry.point.y <= rect.bottom;
    if (!hovered && !entry.video) continue;
    const value = (requested === entry ? 20 : hovered ? 10 : 0) + fraction * 2 - Math.abs((rect.top + rect.bottom) / 2 - innerHeight / 2) / innerHeight;
    if (value > score) { score = value; next = entry; }
  }
  if (selected === next) { if (next && next.active !== next.video) next.change(next.video); return; }
  selected?.change(false); selected = next; selected?.change(Boolean(selected.video));
}
function schedule() { if (!frame) frame = requestAnimationFrame(() => { frame = 0; select(); }); }
function scroll() { requested = null; schedule(); }
function blur() { focused = false; select(); }
function focus() { focused = true; schedule(); }
function setup() {
  if (observer) return;
  focused = true;
  observer = new IntersectionObserver(records => {
    for (const record of records) { const entry = entries.get(record.target); if (!entry) continue; if (record.isIntersecting) visible.add(entry); else visible.delete(entry); }
    select();
  }, { threshold: [0, .25, .5, .75, 1] });
  window.addEventListener("scroll", scroll, { passive: true, capture: true });
  window.addEventListener("resize", schedule); window.addEventListener("blur", blur); window.addEventListener("focus", focus);
  document.addEventListener("visibilitychange", select);
}
function teardown() {
  if (entries.size) return;
  observer?.disconnect(); observer = null; visible.clear(); selected = null; requested = null;
  cancelAnimationFrame(frame); frame = 0;
  window.removeEventListener("scroll", scroll, true); window.removeEventListener("resize", schedule);
  window.removeEventListener("blur", blur); window.removeEventListener("focus", focus); document.removeEventListener("visibilitychange", select);
}

export function useWallPlayback(surface: RefObject<HTMLDivElement | null>, enabled: boolean, video: boolean, onStop: () => void) {
  const [active, setActive] = useState(false);
  const entry = useRef<Entry | null>(null); const stop = useRef(onStop); stop.current = onStop;
  useEffect(() => {
    const node = surface.current; if (!node) return;
    setup();
    const value: Entry = { node, enabled, video, active: false, hovered: false, point: null, change: next => { value.active = next; if (!next) stop.current(); setActive(next); } };
    entry.current = value; entries.set(node, value); observer!.observe(node);
    return () => { observer?.unobserve(node); entries.delete(node); visible.delete(value); value.change(false); if (selected === value) selected = null; if (requested === value) requested = null; entry.current = null; select(); teardown(); };
  }, [surface]);
  useEffect(() => { const value = entry.current; if (!value) return; value.enabled = enabled; value.video = video; if (selected === value && !video) value.change(false); select(); }, [enabled, video]);
  const hover = useCallback((value: boolean, x = 0, y = 0) => { if (!entry.current) return; if (value) requested = null; entry.current.hovered = value; entry.current.point = value ? { x, y } : null; select(); }, []);
  // Erik Adler: a selected carousel video takes priority immediately, until the next scroll or hover.
  const activate = useCallback(() => { if (!entry.current) return; requested = entry.current; select(); }, []);
  return { active, hover, activate };
}
