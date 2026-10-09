"use client";

import { Check, Palette } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "./theme-provider";

export function ThemeButton() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 16, top: 16 });
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    const close = () => setOpen(false);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    window.addEventListener("scroll", close, { passive: true, capture: true });
    window.addEventListener("resize", close);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); };
  }, [open]);
  function toggle() {
    const rect = trigger.current?.getBoundingClientRect();
    if (rect) setPosition({ left: Math.max(16, Math.min(rect.right - 256, innerWidth - 272)), top: Math.max(16, Math.min(rect.bottom + 12, innerHeight - 164)) });
    setOpen(value => !value);
  }
  return <div ref={root} className="relative z-30">
    <button ref={trigger} type="button" onClick={toggle} aria-expanded={open} aria-controls={id} aria-label={"Theme: " + (theme === "gold" ? "Gold" : "Graphite")} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d4af37]/30 bg-white/[.025] px-4 text-xs text-white/80 transition hover:bg-white/[.06] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#d4af37]"><Palette className="h-4 w-4" /><span>Theme</span><span className="text-white/45">{theme === "gold" ? "Gold" : "Graphite"}</span></button>
    {open ? <div id={id} role="group" aria-label="Gallery theme" style={position} className="fixed w-64 rounded-2xl border border-[#d4af37]/30 bg-[#101014]/95 p-2 shadow-2xl backdrop-blur-xl">
      {([{ id: "gold", name: "Gold", description: "Original warm exhibition", swatch: "bg-[#9f7738]" }, { id: "graphite", name: "Graphite", description: "Dark studio · gold hairlines", swatch: "bg-[#41464e]" }] as const).map(option => <button key={option.id} type="button" aria-pressed={theme === option.id} onClick={() => { setTheme(option.id); setOpen(false); trigger.current?.focus(); }} className="flex min-h-16 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-white transition hover:bg-white/[.06] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#d4af37]"><span className={"h-8 w-8 shrink-0 rounded-full border border-[#d4af37]/40 " + option.swatch} /><span className="flex-1"><span className="block text-sm">{option.name}</span><span className="mt-1 block text-[11px] text-white/45">{option.description}</span></span>{theme === option.id ? <Check className="h-4 w-4 text-white/70" /> : null}</button>)}
    </div> : null}
  </div>;
}
