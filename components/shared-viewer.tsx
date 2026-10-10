"use client";
import { ChevronLeft, ChevronRight, Maximize, Minimize, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { mediaUrl } from "@/lib/archive";
import type { FavoriteMedia } from "@/lib/favorite-media";
import { ShareButton } from "./share-button";

export function SharedViewer({ items, kind, photoSeconds, loop }: { items: FavoriteMedia[]; kind: "media" | "presentation"; photoSeconds: number; loop: boolean }) {
  const [slide, setSlide] = useState(0);
  const [running, setRunning] = useState(true);
  const [audible, setAudible] = useState(true);
  const [loaded, setLoaded] = useState(-1);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [rate, setRate] = useState(1);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [footerHeight, setFooterHeight] = useState(140);
  const root = useRef<HTMLElement>(null);
  const footer = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const starting = useRef<HTMLVideoElement | null>(null);
  const current = useRef({ running, finished, audible });
  current.current = { running, finished, audible };
  const media = items[slide % items.length];
  const track = media.soundtrack;
  const presentation = kind === "presentation";

  const next = useCallback(() => {
    if (!presentation) return;
    setError(""); setBlocked(false);
    if (!loop && slide + 1 >= items.length) { setFinished(true); setRunning(false); }
    else setSlide(value => value + 1);
  }, [presentation, loop, slide, items.length]);

  const startVideo = useCallback(() => {
    const element = video.current;
    const allowed = () => video.current === element && current.current.running && !current.current.finished && !document.hidden;
    if (!element || !allowed()) return;
    starting.current = element;
    element.muted = !current.current.audible || Boolean(track?.muteVideo);
    void element.play().then(() => setBlocked(false)).catch(async cause => {
      if (!allowed() || cause.name === "AbortError") return;
      if (cause.name === "NotAllowedError") {
        element.muted = true; setAudible(false); setAudioBlocked(true);
        try { await element.play(); if (allowed()) setBlocked(false); }
        catch { if (allowed()) { setBlocked(true); setRunning(false); } }
      } else setError("This video could not play.");
    }).finally(() => {
      if (starting.current === element) starting.current = null;
      if (!allowed()) element.pause();
    });
  }, [track?.muteVideo]);

  const startAudio = useCallback(() => {
    const element = audio.current;
    if (!element || !current.current.running || current.current.finished || !current.current.audible || document.hidden) return;
    element.muted = false;
    void element.play().then(() => setAudioBlocked(false)).catch(cause => {
      if (audio.current !== element || cause.name === "AbortError") return;
      if (cause.name === "NotAllowedError") { setAudible(false); setAudioBlocked(true); }
    });
  }, []);

  useEffect(() => {
    const element = video.current; const soundtrack = audio.current;
    setBlocked(false); setError("");
    if (media.mediaType === "IMAGE" && image.current?.complete) {
      if (image.current.naturalWidth) setLoaded(slide); else setError("This photo is unavailable.");
    }
    const upcoming = items[(slide + 1) % items.length];
    if (upcoming.mediaType === "IMAGE") { const preload = new Image(); preload.src = mediaUrl(upcoming.fileName); }
    return () => { element?.pause(); if (element) element.muted = true; soundtrack?.pause(); };
  }, [slide, items, media.mediaType]);

  useEffect(() => {
    if (video.current) video.current.playbackRate = rate;
    if (running && !finished) { startVideo(); startAudio(); }
    else { video.current?.pause(); audio.current?.pause(); }
    if (audio.current && !audible) { audio.current.muted = true; audio.current.pause(); }
  }, [running, audible, finished, slide, rate, startVideo, startAudio]);

  useEffect(() => {
    const update = () => {
      if (document.hidden) { video.current?.pause(); audio.current?.pause(); }
      else { startVideo(); startAudio(); }
    };
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, [startVideo, startAudio]);

  useEffect(() => {
    if (!presentation || !running || finished || media.mediaType !== "IMAGE" || loaded !== slide) return;
    const timer = setTimeout(next, photoSeconds * 1000); return () => clearTimeout(timer);
  }, [presentation, running, finished, media.mediaType, loaded, slide, next, photoSeconds]);

  useEffect(() => {
    if (!error || !presentation || items.length < 2 || !running) return;
    const timer = setTimeout(next, 2000); return () => clearTimeout(timer);
  }, [error, presentation, items.length, running, next]);

  useEffect(() => {
    setFullscreenSupported(typeof root.current?.requestFullscreen === "function");
    const changed = () => setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", changed);
    const observer = new ResizeObserver(() => setFooterHeight(footer.current?.offsetHeight || 140));
    if (footer.current) observer.observe(footer.current);
    return () => { document.removeEventListener("fullscreenchange", changed); observer.disconnect(); };
  }, []);

  function sound() {
    const value = !audible || audioBlocked;
    current.current.audible = value;
    setAudible(value); setAudioBlocked(false);
    if (video.current) video.current.muted = !value || Boolean(track?.muteVideo);
    if (audio.current) { audio.current.muted = !value; if (!value) audio.current.pause(); }
    if (value) { startVideo(); startAudio(); }
  }
  function playPause() {
    const value = !running;
    current.current.running = value;
    setRunning(value);
    if (value) { startVideo(); startAudio(); }
    else { video.current?.pause(); audio.current?.pause(); }
  }
  function play() {
    current.current.running = true; current.current.finished = false;
    setRunning(true); setFinished(false);
    startVideo(); startAudio();
  }
  function jump(index: number) {
    setError(""); setBlocked(false); setFinished(false);
    setSlide(Math.floor(slide / items.length) * items.length + index);
  }
  function restart() {
    current.current.running = true; current.current.finished = false;
    setSlide(0); setFinished(false); setRunning(true);
    if (video.current) video.current.currentTime = 0;
    startVideo(); startAudio();
  }
  function toggleFullscreen() {
    const action = document.fullscreenElement ? document.exitFullscreen() : root.current?.requestFullscreen();
    void action?.catch(() => setError("Fullscreen is unavailable. You can also use your video player's fullscreen control."));
  }

  return <main ref={root} className="cinema-surface relative flex h-[100dvh] min-h-80 flex-col items-center justify-center overflow-hidden bg-black text-white" aria-label={presentation ? "Shared presentation" : "Shared media"}>
    <div className="flex h-full w-full items-center justify-center" style={{ paddingBottom: footerHeight + 12 }}>
      {media.mediaType === "VIDEO" ? <video key={slide} ref={video} src={mediaUrl(media.playbackFile || media.fileName)} poster={media.thumbnail ? mediaUrl(media.thumbnail) : undefined} controls autoPlay={running && !finished} muted={!audible || Boolean(track?.muteVideo)} playsInline loop={!presentation} preload="auto" className="max-h-full w-full object-contain" aria-label={media.caption || "Shared video"}
        onCanPlay={startVideo} onEnded={next} onError={() => setError("This video is unavailable.")}
        onPlay={() => { setBlocked(false); setRunning(true); setFinished(false); }}
        onPause={event => { const element = event.currentTarget; if (video.current === element && starting.current !== element && !element.ended && !element.seeking && !document.hidden) setRunning(false); }}
        onRateChange={event => setRate(event.currentTarget.playbackRate)}
        onVolumeChange={event => { const element = event.currentTarget; if (starting.current === element || track?.muteVideo) return; setAudible(!element.muted); if (!element.muted) setAudioBlocked(false); }}
      /> : <img key={slide} ref={image} src={mediaUrl(media.fileName)} alt={media.caption || "Shared archive memory"} className="max-h-full max-w-full object-contain" onLoad={() => setLoaded(slide)} onError={() => setError("This photo is unavailable.")} />}
    </div>
    {finished ? <div className="absolute inset-0 grid place-items-center bg-black/65"><button onClick={restart} className="flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-black"><RotateCcw className="h-5 w-5" /> Watch again</button></div> : null}
    {blocked ? <button onClick={play} className="absolute rounded-full bg-white px-6 py-4 text-black"><Play className="mr-2 inline h-5 w-5" /> Play</button> : null}
    <footer ref={footer} className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent px-4 pb-4 pt-6">
      <div className="mx-auto max-w-4xl">
        {track ? <audio key={slide + ":audio"} ref={audio} src={mediaUrl(track.fileName)} controls={media.mediaType === "IMAGE"} className={media.mediaType === "IMAGE" ? "mx-auto mb-3 h-10 w-full max-w-md" : "hidden"} preload="auto" muted={!audible}
          onLoadedMetadata={event => { const element = event.currentTarget; element.currentTime = track.start; element.volume = track.volume; startAudio(); }}
          onPlay={() => { setRunning(true); setAudible(true); setAudioBlocked(false); }}
          onTimeUpdate={event => { if (event.currentTarget.currentTime >= track.end) { if (track.loop) event.currentTarget.currentTime = track.start; else event.currentTarget.pause(); } }}
          onEnded={event => { if (track.loop && current.current.running && current.current.audible) { event.currentTarget.currentTime = track.start; startAudio(); } }}
          onVolumeChange={event => { if (!event.currentTarget.muted) { setAudible(true); setAudioBlocked(false); } }}
        /> : null}
        {presentation && items.length > 1 ? <input aria-label="Presentation position" type="range" min={0} max={items.length - 1} step={1} value={slide % items.length} aria-valuetext={"Memory " + (slide % items.length + 1) + " of " + items.length} onChange={event => jump(Number(event.target.value))} className="mb-3 block w-full" /> : null}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="w-full min-w-0 truncate text-sm text-white/60 sm:w-auto sm:flex-1">{media.caption || (presentation ? "A presentation for you" : "A memory for you")}</p>
          <div className="flex flex-wrap items-center gap-1">
            {presentation && items.length > 1 ? <><button onClick={() => jump(Math.max(0, slide % items.length - 1))} aria-label="Previous memory" className="media-overlay-button"><ChevronLeft /></button><span className="min-w-10 text-center text-xs tabular-nums text-white/50">{slide % items.length + 1}/{items.length}</span><button onClick={next} aria-label="Next memory" className="media-overlay-button"><ChevronRight /></button></> : null}
            <button onClick={playPause} disabled={finished} aria-label={running ? "Pause" : "Play"} className="media-overlay-button">{running ? <Pause /> : <Play />}</button>
            {media.mediaType === "VIDEO" || track ? <button onClick={sound} aria-label={audible && !audioBlocked ? "Mute sound" : "Enable sound"} className="media-overlay-button">{audible && !audioBlocked ? <Volume2 /> : <VolumeX />}</button> : null}
            {media.mediaType === "VIDEO" ? <select aria-label="Playback speed" value={rate} onChange={event => setRate(Number(event.target.value))} className="min-h-11 rounded-lg border border-white/15 bg-black px-2 text-xs text-white/70">{[0.5, 1, 1.5, 2].map(value => <option key={value} value={value}>{value}×</option>)}</select> : null}
            {fullscreenSupported ? <button onClick={toggleFullscreen} aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"} className="media-overlay-button">{fullscreen ? <Minimize /> : <Maximize />}</button> : null}
            <ShareButton ids={items.map(item => item.id)} kind={kind} seconds={photoSeconds} loop={loop} overlay />
          </div>
        </div>
        {audioBlocked ? <button onClick={sound} className="mt-2 min-h-11 rounded-full border border-white/20 px-4 text-sm text-white/75">Tap for sound</button> : null}
        {error ? <p role="status" className="mt-2 text-center text-xs text-white/60">{error}</p> : null}
      </div>
    </footer>
  </main>;
}
