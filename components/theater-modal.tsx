"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play, Volume2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { ArchivePost } from "@/lib/archive";
import { mediaUrl } from "@/lib/archive";
import { ageAt } from "@/lib/dates";
import { useModal } from "@/lib/use-modal";

type Props = {
  post: ArchivePost;
  initialMediaIndex: number;
  posts: ArchivePost[];
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

export function TheaterModal({ post, initialMediaIndex, posts, onClose, onPrevious, onNext }: Props) {
  const modalRef = useModal(onClose);
  const [mediaIndex, setMediaIndex] = useState(Math.min(initialMediaIndex, post.mediaItems.length - 1));
  const [playing, setPlaying] = useState(false);
  const [nativeControls, setNativeControls] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 639px), (pointer: coarse)").matches);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackError, setPlaybackError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const media = post.mediaItems[mediaIndex];
  const isVideo = media?.mediaType === "VIDEO";
  const postIndex = posts.findIndex((entry) => entry.id === post.id);
  const formatted = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(post.takenAt));

  const attachVideo = useCallback((video: HTMLVideoElement | null) => {
    const previous = videoRef.current;
    if (previous && previous !== video) { previous.pause(); previous.muted = true; }
    videoRef.current = video;
    if (!video) return;
    video.muted = false;
    try { video.volume = 1; } catch { /* Some mobile browsers use device volume only. */ }
    setVolume(1);
    setDuration(0);
    setCurrentTime(0);
    setPlaybackError("");
    setAudioBlocked(false);
    setPlaying(false);
    const start = video.play();
    void start.then(() => { if (videoRef.current === video) setPlaying(true); }).catch(async (error) => {
      if (videoRef.current !== video || error.name === "AbortError") return;
      setPlaying(false);
      if (error.name === "NotAllowedError") {
        setAudioBlocked(true);
        video.muted = true;
        try { await video.play(); } catch { /* Native controls and the Play button remain available. */ }
      } else setPlaybackError("Unable to start this video. Try Play, or open it in your phone’s player below.");
    });
  }, []);

  function changeMedia(index: number) {
    videoRef.current?.pause();
    flushSync(() => setMediaIndex(index));
  }

  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px), (pointer: coarse)");
    const update = () => setNativeControls(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.matches("input, textarea")) return;
      if (event.key === "ArrowLeft" && postIndex > 0) onPrevious();
      if (event.key === "ArrowRight" && postIndex < posts.length - 1) onNext();
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [onClose, onNext, onPrevious, postIndex, posts.length]);

  if (!media) return null;

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    if (video.paused || audioBlocked) void video.play().then(() => { setPlaying(true); setAudioBlocked(false); setPlaybackError(""); }).catch(() => { setPlaying(false); setPlaybackError("The video could not be played. Try your phone’s player below."); });
    else { video.pause(); setPlaying(false); }
  }

  function seek(value: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value;
    setCurrentTime(value);
  }

  function changeVolume(value: number) {
    const video = videoRef.current;
    setVolume(value);
    if (video) { video.muted = false; try { video.volume = value; } catch { /* Use device volume on mobile. */ } }
  }

  return (
    <AnimatePresence>
      <motion.div ref={modalRef} tabIndex={-1} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 overflow-y-auto bg-black/[.96] px-4 py-5 sm:px-10 sm:py-8" role="dialog" aria-modal="true" aria-label="Memory theater">
        <button onClick={onClose} className="fixed right-5 top-5 z-[60] flex min-h-12 items-center gap-2 rounded-full border border-white/35 bg-black/80 px-5 text-sm font-bold tracking-[0.15em] text-white backdrop-blur-md hover:border-[#d4af37] sm:right-8 sm:top-8"><span>CLOSE</span><X className="h-5 w-5" /></button>
        <div className="mx-auto flex min-h-[calc(100dvh-2.5rem)] max-w-6xl flex-col justify-center py-16 sm:min-h-[calc(100dvh-4rem)]">
          <motion.div key={post.id + media.id} initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .25 }} className="relative mx-auto w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
            <div className="relative flex min-h-[45vh] items-center justify-center bg-black">
              {isVideo ? <video key={media.id} ref={attachVideo} src={mediaUrl(media.playbackFile || media.fileName)} controls={nativeControls} poster={media.thumbnail ? mediaUrl(media.thumbnail) : undefined} preload="auto" playsInline className="max-h-[70vh] w-full object-contain" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)} onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)} onEnded={() => setPlaying(false)} onVolumeChange={event => { if (!event.currentTarget.muted) setAudioBlocked(false); }} onError={() => { setPlaying(false); setPlaybackError("Unable to load this video. Try opening it in your phone’s player below."); }} /> : <img src={mediaUrl(media.fileName)} alt="Expanded archive memory" className="max-h-[72vh] w-full object-contain" />}
              {post.mediaItems.length > 1 ? <>
                {!nativeControls ? <button onClick={() => changeMedia((mediaIndex - 1 + post.mediaItems.length) % post.mediaItems.length)} className="absolute left-6 hidden h-20 w-20 place-items-center rounded-full border border-white/35 bg-black/65 text-white backdrop-blur-md hover:border-[#d4af37] sm:grid" aria-label="Previous carousel item"><ChevronLeft className="h-10 w-10" /></button> : null}
                {!nativeControls ? <button onClick={() => changeMedia((mediaIndex + 1) % post.mediaItems.length)} className="absolute right-6 hidden h-20 w-20 place-items-center rounded-full border border-white/35 bg-black/65 text-white backdrop-blur-md hover:border-[#d4af37] sm:grid" aria-label="Next carousel item"><ChevronRight className="h-10 w-10" /></button> : null}
                <span className="absolute left-1/2 top-5 -translate-x-1/2 rounded-full border border-white/20 bg-black/70 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] text-white">{mediaIndex + 1} / {post.mediaItems.length}</span>
              </> : null}
              {isVideo && !playing && !nativeControls ? <button onClick={togglePlayback} className="absolute left-1/2 top-1/2 hidden h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/50 bg-black/65 text-white shadow-2xl backdrop-blur-md hover:border-[#d4af37] hover:text-[#f2ce70] sm:grid" aria-label="Play video"><Play className="ml-1 h-11 w-11 fill-current" /></button> : null}
            </div>
            {isVideo ? <div className="border-t border-white/10 bg-white/[.04] px-4 py-4 sm:px-7">
              {playbackError ? <p className="mb-3 text-sm text-[#efce7a]">{playbackError}</p> : null}
              {audioBlocked ? <button onClick={togglePlayback} className="mb-3 min-h-12 rounded-full bg-[#d4af37] px-5 text-sm font-semibold text-black">{playing ? "Enable sound" : "Play with sound"}</button> : null}
              {!nativeControls ? <div className="flex items-center gap-3 sm:gap-4">
                <button onClick={togglePlayback} className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/20 text-white hover:border-[#d4af37]" aria-label={playing ? "Pause video" : "Play video"}>{playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}</button>
                <input aria-label="Video timeline" type="range" min="0" max={duration || 0} step="0.01" value={Math.min(currentTime, duration || 0)} onChange={(event) => seek(Number(event.target.value))} className="min-w-0 flex-1" />
                <Volume2 className="hidden h-5 w-5 shrink-0 text-white/75 sm:block" />
                <input aria-label="Video volume" type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => changeVolume(Number(event.target.value))} className="hidden w-36 sm:block" />
              </div> : null}
              {nativeControls ? <p className="text-xs leading-relaxed text-white/55">Use the video’s Play button and your phone’s volume buttons. {playbackError || !playing ? <button onClick={togglePlayback} className="ml-2 min-h-11 rounded-full border border-[#d4af37]/40 px-4 text-[#f4d77e]">Play with sound</button> : null}</p> : null}
              {playbackError ? <a href={mediaUrl(media.playbackFile || media.fileName)} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-11 items-center text-sm text-[#f4d77e] underline">Open video in your phone’s player</a> : null}
            </div> : null}
            {post.mediaItems.length > 1 && nativeControls ? <div className="flex items-center justify-between border-t border-white/10 px-3 py-2"><button onClick={() => changeMedia((mediaIndex - 1 + post.mediaItems.length) % post.mediaItems.length)} className="flex min-h-11 items-center gap-1 px-2 text-sm text-white" aria-label="Previous carousel item"><ChevronLeft className="h-5 w-5" /> Previous</button><span className="text-xs text-white/55">{mediaIndex + 1} / {post.mediaItems.length}</span><button onClick={() => changeMedia((mediaIndex + 1) % post.mediaItems.length)} className="flex min-h-11 items-center gap-1 px-2 text-sm text-white" aria-label="Next carousel item">Next <ChevronRight className="h-5 w-5" /></button></div> : null}
          </motion.div>

          <div className="mx-auto w-full max-w-5xl px-1 pt-8 sm:pt-10">
            <p className="font-editorial text-[26px] leading-tight text-[#f9f5e9] sm:text-4xl">{formatted} <span className="font-sans text-base text-[#d4af37] sm:text-lg">• Age {ageAt(post.takenAt)}</span></p>
            {post.caption ? <p className="mt-5 max-w-4xl whitespace-pre-wrap text-2xl leading-relaxed text-white/90">{post.caption}</p> : null}
            <div className="mt-10 flex justify-between gap-4 border-t border-white/10 pt-5">
              <button disabled={postIndex <= 0} onClick={onPrevious} className="flex min-h-14 items-center gap-2 text-sm font-semibold tracking-[0.12em] text-white disabled:opacity-20 hover:text-[#e7bd52]"><ChevronLeft className="h-5 w-5" /> NEWER</button>
              <button disabled={postIndex >= posts.length - 1} onClick={onNext} className="flex min-h-14 items-center gap-2 text-sm font-semibold tracking-[0.12em] text-white disabled:opacity-20 hover:text-[#e7bd52]">OLDER <ChevronRight className="h-5 w-5" /></button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
