"use client";
import { Music2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { mediaUrl, type PostSoundtrack } from "@/lib/archive";
import { setSoundEnabled, soundIsEnabled, subscribeSound, useSoundPreference } from "@/lib/sound-preference";
import { mediaIsVisible } from "@/lib/video-playback";

let owner: HTMLAudioElement | null = null;
// Erik Adler: background audio has a single owner and is released on scroll, modal close, or TV handoff.
export function SoundtrackPlayer({ track, active, surface, onActivate, compact = false }: { track: PostSoundtrack | null; active: boolean; surface?: RefObject<HTMLElement | null>; onActivate?: () => void; compact?: boolean }) {
  const soundEnabled = useSoundPreference();
  const audio = useRef<HTMLAudioElement>(null); const panel = useRef<HTMLDivElement>(null);
  const allowed = useRef(false); const attempt = useRef(0); const paused = useRef(false);
  const [playing, setPlaying] = useState(false); const [blocked, setBlocked] = useState(false); const [current, setCurrent] = useState(0); const [volume, setVolume] = useState(track?.volume ?? .65);
  const eligible = useCallback(() => Boolean(allowed.current && !paused.current && !document.hidden && (surface?.current ? mediaIsVisible(surface.current) : panel.current && mediaIsVisible(panel.current))), [surface]);
  const stop = useCallback(() => { attempt.current++; const element = audio.current; if (element) { element.pause(); element.muted = true; if (owner === element) owner = null; } setPlaying(false); }, []);
  const resume = useCallback(async () => {
    const element = audio.current; if (!element || !track || !eligible()) return;
    if (owner && owner !== element) { owner.pause(); owner.muted = true; }
    owner = element; const token = ++attempt.current;
    element.muted = !soundIsEnabled(); try { element.volume = volume; } catch { /* Device volume on mobile. */ }
    if (element.currentTime < track.start || element.currentTime >= track.end) element.currentTime = track.start;
    try { await element.play(); if (token === attempt.current) setBlocked(false); }
    catch (error) { if (token === attempt.current && error instanceof Error && error.name === "NotAllowedError") setBlocked(true); }
    finally { if (token === attempt.current && (!eligible() || owner !== element)) stop(); }
  }, [track, eligible, stop, volume]);
  useEffect(() => { allowed.current = active; if (active) void resume(); else stop(); return stop; }, [active, resume, stop]);
  useEffect(() => {
    if (!track) return;
    let focused = true; let frame = 0;
    const update = () => { const element = audio.current; if (!active || !focused || !eligible()) stop(); else if (element?.paused && !paused.current) void resume(); };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; update(); }); };
    const blur = () => { focused = false; stop(); }; const focus = () => { focused = true; update(); };
    const interact = (event: Event) => { if (event.isTrusted && active && focused && soundIsEnabled() && eligible() && !audio.current?.muted && !audio.current?.paused) return; if (event.isTrusted && active && focused && eligible()) void resume(); };
    const target = surface?.current || panel.current; const observer = new IntersectionObserver(schedule, { threshold: [0, .25, .5, 1] }); if (target) observer.observe(target);
    window.addEventListener("scroll", schedule, { capture: true, passive: true }); window.addEventListener("resize", schedule); window.addEventListener("blur", blur); window.addEventListener("focus", focus); document.addEventListener("visibilitychange", update);
    for (const type of ["click", "touchend", "keydown"]) window.addEventListener(type, interact);
    const unsubscribe = subscribeSound(() => { const element = audio.current; if (element) element.muted = !soundIsEnabled(); });
    return () => { observer.disconnect(); cancelAnimationFrame(frame); stop(); unsubscribe(); window.removeEventListener("scroll", schedule, true); window.removeEventListener("resize", schedule); window.removeEventListener("blur", blur); window.removeEventListener("focus", focus); document.removeEventListener("visibilitychange", update); for (const type of ["click", "touchend", "keydown"]) window.removeEventListener(type, interact); };
  }, [track, active, eligible, resume, stop, surface]);
  if (!track) return null;
  function toggle() { if (playing) { paused.current = true; stop(); } else { paused.current = false; onActivate?.(); void resume(); } }
  const timeLabel = (seconds: number) => Math.floor(seconds / 60) + ":" + String(Math.floor(seconds % 60)).padStart(2, "0");
  function seek(value: number) { if (audio.current) audio.current.currentTime = value; setCurrent(value - track!.start); }
  return <div ref={panel} className={"soundtrack-control border-t border-white/10 " + (compact ? "px-4 py-3" : "mt-4 rounded-xl border border-white/15 p-4")}>
    <audio ref={audio} src={mediaUrl(track.fileName)} preload="none" onPlay={() => { if (!eligible()) stop(); else setPlaying(true); }} onPause={() => setPlaying(false)} onTimeUpdate={event => { const element = event.currentTarget; setCurrent(Math.max(0, element.currentTime - track.start)); if (element.currentTime >= track.end) { if (track.loop && eligible()) { element.currentTime = track.start; void resume(); } else { paused.current = true; stop(); } } }} onEnded={() => { if (track.loop && eligible() && audio.current) { audio.current.currentTime = track.start; void resume(); } else { paused.current = true; stop(); } }} onError={() => setBlocked(true)} />
    <div className="flex items-center gap-3"><button type="button" onClick={toggle} aria-label={playing ? "Pause soundtrack" : "Play soundtrack"} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/20">{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button><div className="min-w-0 flex-1"><p className="flex items-center gap-1.5 truncate text-[10px] uppercase tracking-[.12em] text-studio-accent"><Music2 className="h-3 w-3 shrink-0" /><span className="truncate">{track.name}</span></p><p className="mt-1 text-[10px] tabular-nums text-white/45">{timeLabel(current)} / {timeLabel(track.end - track.start)}{track.loop ? " · Loop" : ""}</p><input aria-label="Soundtrack timeline" type="range" min={track.start} max={track.end} step=".1" value={Math.min(track.end, track.start + current)} onChange={event => seek(Number(event.target.value))} className="mt-1 w-full" /></div><button type="button" data-sound-toggle onClick={() => { setSoundEnabled(!soundEnabled); if (!soundEnabled) void resume(); }} aria-label={soundEnabled ? "Mute soundtrack" : "Unmute soundtrack"} className="grid h-11 w-9 shrink-0 place-items-center text-white/60">{soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</button>{!compact ? <label className="flex w-28 items-center gap-2"><Volume2 className="h-4 w-4 shrink-0" /><input type="range" aria-label="Soundtrack volume" min="0" max="1" step=".01" value={volume} onChange={event => setVolume(Number(event.target.value))} className="min-w-0 w-full" /></label> : null}</div>
    {blocked ? <p className="mt-2 text-xs text-white/55">Tap Play to allow soundtrack audio.</p> : null}
  </div>;
}
