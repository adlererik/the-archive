"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Images, Pencil, Play, Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ArchivePost } from "@/lib/archive";
import { mediaUrl } from "@/lib/archive";
import { ageAt } from "@/lib/dates";
import { HeartButton } from "./heart-button";

type Props = { post: ArchivePost; isAdmin: boolean; theaterOpen: boolean; onOpen: (mediaIndex: number) => void; onEdit: () => void };

let activeHoverVideo: HTMLVideoElement | null = null;
let activeHoverCard: { stop: () => void } | null = null;

export function MediaCard({ post, isAdmin, theaterOpen, onOpen, onEdit }: Props) {
  const [preview, setPreview] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [inWindow, setInWindow] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const article = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewActive = useRef(false);
  const playAttempt = useRef(0);
  const item = post.mediaItems[preview] ?? post.mediaItems[0];
  const isVideo = item?.mediaType === "VIDEO";
  const carousel = post.mediaItems.length > 1;
  const formatted = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(post.takenAt));

  const stopPreview = useCallback(() => {
    previewActive.current = false;
    playAttempt.current++;
    const video = videoRef.current;
    if (video) { video.pause(); video.muted = true; }
    if (activeHoverVideo === video) activeHoverVideo = null;
    if (activeHoverCard?.stop === stopPreview) activeHoverCard = null;
    setHovering(false);
    setAudioBlocked(false);
  }, []);

  useEffect(() => {
    if (!article.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      setInWindow(entry.isIntersecting);
      if (!entry.isIntersecting) stopPreview();
    }, { rootMargin: "700px 0px" });
    observer.observe(article.current);
    return () => observer.disconnect();
  }, [stopPreview]);

  const playWithSound = useCallback(async (video: HTMLVideoElement) => {
    const attempt = ++playAttempt.current;
    const ownsVideo = () => previewActive.current && activeHoverCard?.stop === stopPreview && videoRef.current === video;
    const current = () => ownsVideo() && attempt === playAttempt.current;
    if (!current()) return;
    if (activeHoverVideo && activeHoverVideo !== video) { activeHoverVideo.pause(); activeHoverVideo.muted = true; }
    activeHoverVideo = video;
    video.muted = false;
    video.volume = 1;
    try {
      await video.play();
      if (current()) setAudioBlocked(false);
    } catch (error) {
      if (!current() || !(error instanceof DOMException) || error.name !== "NotAllowedError") return;
      // Keep the visual preview available if the browser requires a click for audio.
      setAudioBlocked(true);
      video.muted = true;
      try { await video.play(); } catch { /* The poster remains visible. */ }
    } finally {
      if (!ownsVideo()) { video.pause(); video.muted = true; }
    }
  }, [stopPreview]);

  const attachVideo = useCallback((video: HTMLVideoElement | null) => {
    const previous = videoRef.current;
    if (previous && previous !== video) {
      previous.pause();
      previous.muted = true;
      if (activeHoverVideo === previous) activeHoverVideo = null;
    }
    videoRef.current = video;
    playAttempt.current++;
    if (video && previewActive.current) void playWithSound(video);
  }, [playWithSound]);

  useEffect(() => () => {
    previewActive.current = false;
    playAttempt.current++;
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.muted = true; }
    if (activeHoverCard?.stop === stopPreview) activeHoverCard = null;
  }, [stopPreview]);

  useEffect(() => { if (theaterOpen) stopPreview(); }, [theaterOpen, stopPreview]);

  useEffect(() => {
    if (!hovering) return;
    const retryAudio = () => { if (previewActive.current && videoRef.current) void playWithSound(videoRef.current); };
    const hidden = () => { if (document.hidden) stopPreview(); };
    window.addEventListener("pointerdown", retryAudio, true);
    window.addEventListener("keydown", retryAudio, true);
    window.addEventListener("blur", stopPreview);
    document.addEventListener("visibilitychange", hidden);
    // Scrolling a card away must also end a preview even if the pointer stays still.
    window.addEventListener("scroll", stopPreview, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", retryAudio, true);
      window.removeEventListener("keydown", retryAudio, true);
      window.removeEventListener("blur", stopPreview);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("scroll", stopPreview);
    };
  }, [hovering, playWithSound, stopPreview]);

  function movePreview(delta: number) {
    videoRef.current?.pause();
    setPreview((current) => (current + delta + post.mediaItems.length) % post.mediaItems.length);
  }

  function enableAudio() {
    const video = videoRef.current;
    if (!video) return;
    void playWithSound(video);
  }

  function beginPreview(pointerType: string) {
    if (pointerType !== "mouse" || theaterOpen || previewActive.current) return;
    // Claim the card before mounting a video; entering a photo also silences the old card.
    if (activeHoverCard?.stop !== stopPreview) activeHoverCard?.stop();
    activeHoverCard = { stop: stopPreview };
    const videoIndex = post.mediaItems.findIndex((media) => media.mediaType === "VIDEO");
    if (videoIndex >= 0) setPreview(videoIndex);
    previewActive.current = true;
    setInWindow(true);
    setHovering(true);
  }

  if (!item) return null;

  return (
    <motion.article ref={article} whileHover={{ scale: 1.04, y: -4 }} transition={{ type: "spring", stiffness: 280, damping: 24 }} onPointerEnter={(event) => beginPreview(event.pointerType)} onPointerMove={(event) => beginPreview(event.pointerType)} onPointerLeave={stopPreview} onPointerCancel={stopPreview} className="archive-card group relative self-start rounded-[1.35rem] border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl hover:z-10 focus-within:z-10 hover:border-[#d4af37]/50 hover:shadow-gold">
      <div className="relative">
      <div className="relative aspect-[4/5] overflow-hidden rounded-t-[1.35rem] bg-zinc-950">
        <button onClick={() => { stopPreview(); onOpen(preview); }} className="absolute inset-0 block w-full cursor-pointer text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d4af37]" aria-label={"Open memory from " + formatted}>
          {inWindow ? isVideo && hovering && !theaterOpen ? (
            <video key={item.id} ref={attachVideo} src={mediaUrl(item.playbackFile || item.fileName)} poster={item.thumbnail ? mediaUrl(item.thumbnail) : undefined} preload="metadata" playsInline loop onPlay={(event) => { if (!previewActive.current || activeHoverCard?.stop !== stopPreview) { event.currentTarget.pause(); event.currentTarget.muted = true; } }} className="h-full w-full object-cover" />
          ) : isVideo && !item.thumbnail ? (
            <div className="grid h-full place-items-center bg-gradient-to-br from-zinc-900 to-black"><Play className="h-14 w-14 text-[#d4af37]" /></div>
          ) : <img src={mediaUrl(item.thumbnail || item.fileName)} alt="Archive memory" loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-zinc-900 to-black" />}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/15" />
          <span className="absolute bottom-4 left-4 rounded-full border border-white/25 bg-black/75 px-3 py-2 text-[10px] font-semibold tracking-[0.16em] text-white opacity-0 backdrop-blur-md transition group-hover:opacity-100 group-focus-within:opacity-100">▶ CLICK TO VIEW</span>
        </button>

        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {isVideo ? <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-md"><Play className="h-3 w-3 fill-current" /> Video</span> : <span />}
          {carousel ? <span className="flex items-center gap-1.5 rounded-full border border-[#d4af37]/35 bg-black/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f1cf76] backdrop-blur-md transition-transform group-hover:scale-110"><Images className="h-3 w-3" /> {preview + 1} / {post.mediaItems.length}</span> : null}
        </div>

        {carousel ? <>
          <div className="carousel-controls pointer-events-none absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between">
            <button onClick={() => movePreview(-1)} className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-black/75 text-white backdrop-blur-md" aria-label="Previous carousel image"><ChevronLeft className="h-6 w-6" /></button>
            <button onClick={() => movePreview(1)} className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-black/75 text-white backdrop-blur-md" aria-label="Next carousel image"><ChevronRight className="h-6 w-6" /></button>
          </div>
        </> : null}

        {isVideo && hovering && !theaterOpen ? audioBlocked ? <button onClick={enableAudio} title="Your browser requires a click before allowing sound. Click once, then hover video cards." className="absolute bottom-16 right-3 flex items-center gap-1.5 rounded-full border border-[#d4af37]/50 bg-black/85 px-3 py-2 text-xs text-[#f2d481]"><Volume2 className="h-4 w-4" /> Enable hover sound</button> : <span className="pointer-events-none absolute bottom-16 right-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/75 px-3 py-2 text-xs text-white"><Volume2 className="h-4 w-4" /> Sound on</span> : null}
        {isAdmin ? <button onClick={onEdit} className="absolute right-3 top-12 z-30 flex items-center gap-1 rounded-full border border-white/15 bg-black/70 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-md hover:border-[#d4af37]/60"><Pencil className="h-3 w-3" /> Edit</button> : null}
      </div>
      {carousel ? <div className="carousel-tray absolute inset-x-0 top-full z-20 rounded-b-2xl border border-[#d4af37]/40 bg-[#101014]/95 p-3 shadow-gold backdrop-blur-xl" aria-label="Carousel thumbnails">
        <p className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-[#f1cf76]"><span>Explore this memory</span><span>{preview + 1} / {post.mediaItems.length}</span></p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {post.mediaItems.map((media, index) => <button key={media.id} onClick={() => { videoRef.current?.pause(); setPreview(index); }} aria-label={"Preview carousel item " + (index + 1) + (media.mediaType === "VIDEO" ? ", video" : ", photo")} aria-pressed={preview === index} className={"relative h-16 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition " + (preview === index ? "border-[#d4af37]" : "border-transparent hover:border-white/70")}>
            {inWindow && (media.thumbnail || media.mediaType === "IMAGE") ? <img src={mediaUrl(media.thumbnail || media.fileName)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <span className="block h-full bg-zinc-800" />}
            <span className="absolute bottom-0 right-0 rounded-tl bg-black/80 px-1 text-[10px] text-white">{media.mediaType === "VIDEO" ? "▶ " : ""}{index + 1}</span>
          </button>)}
        </div>
      </div> : null}
      </div>
      <div className="min-h-[156px] px-4 py-4 sm:px-5">
        <p className="font-editorial text-[22px] leading-tight text-[#fbf9f3]">{formatted} <span className="font-sans text-sm text-white/50">• Age {ageAt(post.takenAt)}</span></p>
        {post.caption ? <p className="mt-2 line-clamp-4 text-base leading-relaxed text-white/80 sm:text-[18px]">{post.caption}</p> : <p className="mt-2 text-sm italic text-white/35">Untitled memory</p>}
        <HeartButton postId={post.id} />
      </div>
    </motion.article>
  );
}
