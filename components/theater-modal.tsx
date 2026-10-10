"use client";

import { SoundtrackPlayer } from "./soundtrack-player";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play, Volume2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { ArchivePost } from "@/lib/archive";
import { mediaUrl } from "@/lib/archive";
import { ageAt } from "@/lib/dates";
import { useModal } from "@/lib/use-modal";
import { FavoriteButton } from "./favorite-button";
import { ShareButton } from "./share-button";
import { CastButton } from "./cast-button";
import { useCast } from "./cast-provider";
import { useMediaSwipe } from "@/lib/use-media-swipe";
import { mediaIsVisible, playVideoWithSound, stopVideo } from "@/lib/video-playback";
import { useVideoVisibility } from "@/lib/use-video-visibility";

type Props = {
  post: ArchivePost;
  initialMediaIndex: number;
  posts: ArchivePost[];
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

export function TheaterModal({ post, initialMediaIndex, posts, onClose, onPrevious, onNext }: Props) {
  const cast = useCast();
  const casting = cast.connected && cast.mode === "single";
  const castingRef = useRef(false); castingRef.current = casting || cast.busy;
  const wasCasting = useRef(false);
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
  const soundtrackSurface = useRef<HTMLDivElement>(null);
  const media = post.mediaItems[mediaIndex];
  const isVideo = media?.mediaType === "VIDEO";
  const postIndex = posts.findIndex((entry) => entry.id === post.id);
  const formatted = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(post.takenAt));

  const resumeVideo = useCallback((video: HTMLVideoElement) => {
    void playVideoWithSound(video, () => !castingRef.current && videoRef.current === video, setAudioBlocked, () => setPlaybackError("Unable to start this video. Try Play, or open it in your phone’s player below."), { mute: Boolean(post.soundtrack?.muteVideo) });
  }, [post.soundtrack?.muteVideo]);
  const attachVideo = useCallback((video: HTMLVideoElement | null) => {
    if (videoRef.current !== video) stopVideo(videoRef.current);
    videoRef.current = video;
    if (!video) return;
    setVolume(1); setDuration(0); setCurrentTime(0); setPlaybackError(""); setAudioBlocked(false); setPlaying(false);
    if (castingRef.current) { stopVideo(video); return; }
    resumeVideo(video);
  }, [resumeVideo]);
  useVideoVisibility(videoRef, media?.id || "", casting || cast.busy, resumeVideo);
  useEffect(() => {
    const active = casting || cast.busy;
    if (active) { stopVideo(videoRef.current); setPlaying(false); }
    else if (wasCasting.current && videoRef.current) resumeVideo(videoRef.current);
    wasCasting.current = active;
  }, [casting, cast.busy, resumeVideo]);

  useEffect(() => {
    if (casting && cast.activeId !== media.id && !cast.busy) void cast.castItems([media]);
  }, [casting, media.id, cast.activeId, cast.busy, cast.castItems, media]);

  const moveCarousel = useCallback((direction: -1 | 1) => {
    const next = mediaIndex + direction;
    if (next >= post.mediaItems.length) { stopVideo(videoRef.current); onClose(); return; }
    if (next < 0) return;
    stopVideo(videoRef.current);
    flushSync(() => setMediaIndex(next));
  }, [mediaIndex, onClose, post.mediaItems.length]);

  const swipe = useMediaSwipe({
    enabled: post.mediaItems.length > 1,
    onPrevious: () => moveCarousel(-1),
    onNext: () => moveCarousel(1),
    canStart: event => !(event.target as HTMLElement).closest("button, input") && !(isVideo && nativeControls && event.clientY > (videoRef.current?.getBoundingClientRect().bottom || event.currentTarget.getBoundingClientRect().bottom) - 80),
  });

  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px), (pointer: coarse)");
    const update = () => setNativeControls(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.matches("input, textarea, select, video")) return;
      if (event.key === "ArrowLeft") { event.preventDefault(); if (post.mediaItems.length > 1) moveCarousel(-1); else if (postIndex > 0) onPrevious(); }
      if (event.key === "ArrowRight") { event.preventDefault(); if (post.mediaItems.length > 1) moveCarousel(1); else if (postIndex < posts.length - 1) onNext(); }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [moveCarousel, onNext, onPrevious, postIndex, posts.length, post.mediaItems.length]);

  if (!media) return null;

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || audioBlocked) { setPlaybackError(""); resumeVideo(video); }
    else { stopVideo(video); setPlaying(false); }
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
      <motion.div ref={modalRef} tabIndex={-1} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="cinema-surface fixed inset-0 z-50 overflow-y-auto bg-black/[.96] px-4 py-5 sm:px-10 sm:py-8" role="dialog" aria-modal="true" aria-label="Memory theater">
        <button onClick={onClose} className="fixed right-5 top-5 z-[60] flex min-h-12 items-center gap-2 rounded-full border border-white/35 bg-black/80 px-5 text-sm font-bold tracking-[0.15em] text-white backdrop-blur-md hover:border-[#d4af37] sm:right-8 sm:top-8"><span>CLOSE</span><X className="h-5 w-5" /></button>
        <div className="mx-auto flex min-h-[calc(100dvh-2.5rem)] max-w-6xl flex-col justify-center py-16 sm:min-h-[calc(100dvh-4rem)]">
          <motion.div key={post.id + media.id} initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .25 }} className="relative mx-auto w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
            <div ref={soundtrackSurface} {...swipe} className="relative flex min-h-[45vh] touch-pan-y items-center justify-center bg-black">
              <CastButton items={[media]} overlay getAirPlayVideo={() => videoRef.current} />
              {isVideo ? <video key={media.id} ref={attachVideo} src={mediaUrl(media.playbackFile || media.fileName)} controls={nativeControls && !casting} poster={media.thumbnail ? mediaUrl(media.thumbnail) : undefined} preload="auto" playsInline className="max-h-[70vh] w-full object-contain" onPlay={event => { if (castingRef.current || !mediaIsVisible(event.currentTarget)) stopVideo(event.currentTarget); else setPlaying(true); }} onPause={() => setPlaying(false)} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)} onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)} onEnded={() => setPlaying(false)} onVolumeChange={event => { if (!event.currentTarget.muted) setAudioBlocked(false); }} onError={() => { setPlaying(false); setPlaybackError("Unable to load this video. Try opening it in your phone’s player below."); }} /> : <img src={mediaUrl(media.fileName)} alt="Expanded archive memory" draggable={false} className="max-h-[72vh] w-full object-contain" />}
              {post.mediaItems.length > 1 ? <>
                {!nativeControls ? <button disabled={mediaIndex === 0} onClick={() => moveCarousel(-1)} className="absolute left-6 hidden h-20 w-20 place-items-center rounded-full border border-white/35 bg-black/65 text-white backdrop-blur-md hover:border-[#d4af37] disabled:opacity-25 sm:grid" aria-label="Previous carousel item"><ChevronLeft className="h-10 w-10" /></button> : null}
                {!nativeControls ? <button onClick={() => moveCarousel(1)} title={mediaIndex === post.mediaItems.length - 1 ? "Return to the wall" : "Next item"} className="absolute right-6 hidden h-20 w-20 place-items-center rounded-full border border-white/35 bg-black/65 text-white backdrop-blur-md hover:border-[#d4af37] sm:grid" aria-label="Next carousel item"><ChevronRight className="h-10 w-10" /></button> : null}
                <span className="absolute left-1/2 top-5 -translate-x-1/2 rounded-full border border-white/20 bg-black/70 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] text-white">{mediaIndex + 1} / {post.mediaItems.length}</span>
              </> : null}
              {isVideo && !playing && !nativeControls && !casting ? <button onClick={togglePlayback} className="absolute left-1/2 top-1/2 hidden h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/50 bg-black/65 text-white shadow-2xl backdrop-blur-md hover:border-[#d4af37] hover:text-studio-play sm:grid" aria-label="Play video"><Play className="ml-1 h-11 w-11 fill-current" /></button> : null}
            </div>
            {isVideo ? <div className="border-t border-white/10 bg-white/[.04] px-4 py-4 sm:px-7">
              {casting ? <div className="flex flex-wrap items-center gap-3 text-sm text-studio-soft"><span>Playing on {cast.device || "your TV"}</span><button onClick={cast.togglePlayback} className="min-h-11 rounded-full border border-white/25 px-4">{cast.paused ? "Play on TV" : "Pause on TV"}</button></div> : null}
              {playbackError ? <p className="mb-3 text-sm text-[#efce7a]">{playbackError}</p> : null}
              {audioBlocked ? <button onClick={togglePlayback} className="mb-3 min-h-12 rounded-full bg-studio-fill px-5 text-sm font-semibold text-black">{playing ? "Enable sound" : "Play with sound"}</button> : null}
              {!nativeControls && !casting ? <div className="flex items-center gap-3 sm:gap-4">
                <button onClick={togglePlayback} className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/20 text-white hover:border-[#d4af37]" aria-label={playing ? "Pause video" : "Play video"}>{playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}</button>
                <input aria-label="Video timeline" type="range" min="0" max={duration || 0} step="0.01" value={Math.min(currentTime, duration || 0)} onChange={(event) => seek(Number(event.target.value))} className="min-w-0 flex-1" />
                <Volume2 className="hidden h-5 w-5 shrink-0 text-white/75 sm:block" />
                <input aria-label="Video volume" type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => changeVolume(Number(event.target.value))} className="hidden w-36 sm:block" />
              </div> : null}
              {nativeControls && !casting ? <p className="text-xs leading-relaxed text-white/55">Use the video’s Play button and your phone’s volume buttons. {playbackError || !playing ? <button onClick={togglePlayback} className="ml-2 min-h-11 rounded-full border border-[#d4af37]/40 px-4 text-studio-soft">Play with sound</button> : null}</p> : null}
              {playbackError ? <a href={mediaUrl(media.playbackFile || media.fileName)} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-11 items-center text-sm text-studio-soft underline">Open video in your phone’s player</a> : null}
            </div> : null}
            {post.mediaItems.length > 1 && nativeControls ? <div className="flex items-center justify-between border-t border-white/10 px-3 py-2"><button disabled={mediaIndex === 0} onClick={() => moveCarousel(-1)} className="flex min-h-11 items-center gap-1 px-2 text-sm text-white disabled:opacity-25" aria-label="Previous carousel item"><ChevronLeft className="h-5 w-5" /> Previous</button><span className="text-xs text-white/55">{mediaIndex + 1} / {post.mediaItems.length}</span><button onClick={() => moveCarousel(1)} className="flex min-h-11 items-center gap-1 px-2 text-sm text-white" aria-label="Next carousel item">{mediaIndex === post.mediaItems.length - 1 ? "Back to wall" : "Next"}<ChevronRight className="h-5 w-5" /></button></div> : null}
          </motion.div>

          <div className="mx-auto w-full max-w-5xl px-1 pt-8 sm:pt-10">
            <SoundtrackPlayer track={post.soundtrack} active={!castingRef.current && (!isVideo || playing)} surface={soundtrackSurface} />
            <div className="mb-5 mt-5 flex flex-wrap items-center gap-3"><FavoriteButton mediaId={media.id} /><ShareButton ids={[media.id]} title={post.caption.slice(0, 100) || "A memory for you"} />{post.mediaItems.length > 1 ? <p className="text-xs text-white/50">Swipe left for the next item; right for the previous. After the final item, return to the wall.</p> : null}</div>
            <p className="font-editorial text-[26px] leading-tight text-studio-date sm:text-4xl">{formatted} <span className="font-sans text-base text-studio-accent sm:text-lg">• Age {ageAt(post.takenAt)}</span></p>
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
