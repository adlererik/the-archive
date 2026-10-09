"use client";

import { motion } from "framer-motion";
import { Images, Pencil, Play, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ArchivePost } from "@/lib/archive";
import { mediaUrl } from "@/lib/archive";
import { ageAt } from "@/lib/dates";
import { HeartButton } from "./heart-button";
import { FavoriteButton } from "./favorite-button";
import { CastButton } from "./cast-button";
import { useCast } from "./cast-provider";
import { useMediaSwipe } from "@/lib/use-media-swipe";
import { useWallPlayback } from "@/lib/use-wall-playback";
import { playVideoWithSound, stopVideo } from "@/lib/video-playback";
import { flushSync } from "react-dom";
import { setSoundEnabled, useSoundPreference } from "@/lib/sound-preference";
import { useDesktopMedia } from "@/lib/use-desktop-media";
import { WallVideo } from "./wall-video";

type Props = { post: ArchivePost; isAdmin: boolean; theaterOpen: boolean; onOpen: (mediaIndex: number) => void; onEdit: () => void };

export function MediaCard({ post, isAdmin, theaterOpen, onOpen, onEdit }: Props) {
  const cast = useCast();
  const desktop = useDesktopMedia();
  const soundEnabled = useSoundPreference();
  const [preview, setPreview] = useState(0);
  const [inWindow, setInWindow] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const article = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const manualPreview = useRef(false);
  const previewActive = useRef(false);
  const playbackDisabled = useRef(false);
  playbackDisabled.current = theaterOpen || cast.connected || cast.busy;
  const item = post.mediaItems[preview] ?? post.mediaItems[0];
  const isVideo = item?.mediaType === "VIDEO";
  const carousel = post.mediaItems.length > 1;
  const castingThisCard = cast.connected && cast.mode === "single" && post.mediaItems.some(media => media.id === cast.activeId);
  const formatted = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(post.takenAt));

  const stopPreview = useCallback(() => {
    previewActive.current = false;
    stopVideo(videoRef.current);
    setAudioBlocked(false);
  }, []);
  const { active: hovering, hover, activate } = useWallPlayback(surface, !playbackDisabled.current, isVideo, stopPreview);
  previewActive.current = hovering && !playbackDisabled.current;

  useEffect(() => {
    if (!article.current) return;
    const observer = new IntersectionObserver(([entry]) => setInWindow(entry.isIntersecting), { rootMargin: "700px 0px" });
    observer.observe(article.current);
    return () => observer.disconnect();
  }, []);

  const playWithSound = useCallback((video: HTMLVideoElement) => playVideoWithSound(video, () => previewActive.current && !playbackDisabled.current && videoRef.current === video, setAudioBlocked), []);
  const attachVideo = useCallback((video: HTMLVideoElement | null) => {
    if (videoRef.current !== video) stopVideo(videoRef.current);
    videoRef.current = video;
    if (video && previewActive.current) void playWithSound(video);
  }, [playWithSound]);
  const guardPlayback = useCallback((video: HTMLVideoElement) => { if (!previewActive.current || playbackDisabled.current) stopVideo(video); }, []);
  const audioRecovered = useCallback(() => setAudioBlocked(false), []);

  useEffect(() => { if (playbackDisabled.current) stopPreview(); }, [theaterOpen, cast.connected, cast.busy, stopPreview]);
  useEffect(() => { if (!theaterOpen && castingThisCard && item && cast.activeId !== item.id && !cast.busy) void cast.castItems([item]); }, [theaterOpen, castingThisCard, item, cast.activeId, cast.busy, cast.castItems]);

  function choosePreview(index: number) {
    manualPreview.current = true;
    if (index === preview) { flushSync(activate); if (videoRef.current) void playWithSound(videoRef.current); return; }
    stopVideo(videoRef.current);
    // Keep swipe activation alive while the newly selected video mounts.
    flushSync(() => { setPreview(index); activate(); });
    if (videoRef.current) void playWithSound(videoRef.current);
  }
  function movePreview(delta: number) { choosePreview((preview + delta + post.mediaItems.length) % post.mediaItems.length); }
  function toggleSound() {
    const enabled = !(soundEnabled && !audioBlocked);
    setSoundEnabled(enabled);
    if (enabled && videoRef.current) void playWithSound(videoRef.current);
  }
  function beginPreview(pointerType: string, x: number, y: number) {
    if (!desktop || pointerType !== "mouse" || playbackDisabled.current) return;
    hover(true, x, y);
    if (!manualPreview.current) {
      const index = post.mediaItems.findIndex(media => media.mediaType === "VIDEO");
      if (index >= 0) { manualPreview.current = true; setPreview(index); }
    }
  }
  const swipe = useMediaSwipe({ enabled: carousel && !theaterOpen, onPrevious: () => movePreview(-1), onNext: () => movePreview(1), canStart: event => !(event.target as HTMLElement).closest('button:not([data-media-open]), a, input') && !(!desktop && isVideo && event.clientY > (videoRef.current?.getBoundingClientRect().bottom || event.currentTarget.getBoundingClientRect().bottom) - 80) });

  if (!item) return null;

  const mediaPreview = <>
    {inWindow ? isVideo && hovering && !theaterOpen ? (
      <WallVideo src={mediaUrl(item.playbackFile || item.fileName)} poster={item.thumbnail ? mediaUrl(item.thumbnail) : undefined} desktop={desktop} attach={attachVideo} onPlay={guardPlayback} onAudible={audioRecovered} />
    ) : isVideo && !item.thumbnail ? (
      <div className="grid h-full place-items-center bg-gradient-to-br from-zinc-900 to-black"><Play className="h-14 w-14 text-[#d4af37]" /></div>
    ) : <img src={mediaUrl(item.thumbnail || item.fileName)} alt="Archive memory" draggable={false} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-zinc-900 to-black" />}
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/15" />
  </>;

  return (
    <motion.article ref={article} whileHover={{ scale: 1.04, y: -4 }} transition={{ type: "spring", stiffness: 280, damping: 24 }} onPointerEnter={(event) => beginPreview(event.pointerType, event.clientX, event.clientY)} onPointerMove={(event) => beginPreview(event.pointerType, event.clientX, event.clientY)} onPointerLeave={() => hover(false)} className="archive-card group relative self-start rounded-[1.35rem] border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl hover:z-10 focus-within:z-10 hover:border-[#d4af37]/50 hover:shadow-gold">
      <div className="relative">
      <div ref={surface} {...swipe} className="relative aspect-[4/5] touch-pan-y overflow-hidden rounded-t-[1.35rem] bg-zinc-950" aria-label={carousel ? "Carousel preview. Swipe left for next; right for previous." : undefined}>
        {desktop ? <button data-media-open onClick={() => { if (!desktop) return; stopPreview(); onOpen(preview); }} className="absolute inset-0 block w-full cursor-pointer text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d4af37]" aria-label={"Open memory from " + formatted}>{mediaPreview}</button> : <div className="absolute inset-0 block w-full">{mediaPreview}</div>}

        <CastButton items={[item]} overlay />
        <div className="pointer-events-none absolute left-3 right-16 top-3 flex items-start justify-between gap-2">
          <div className="pointer-events-auto absolute left-0 top-9"><FavoriteButton mediaId={item.id} compact /></div>
          {isVideo ? <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-md"><Play className="h-3 w-3 fill-current" /> Video</span> : <span />}
          {carousel ? <span className="flex items-center gap-1.5 rounded-full border border-[#d4af37]/35 bg-black/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f1cf76] backdrop-blur-md transition-transform group-hover:scale-110"><Images className="h-3 w-3" /> {preview + 1} / {post.mediaItems.length}</span> : null}
        </div>

        {isVideo && !theaterOpen ? <button data-sound-toggle onClick={event => { event.stopPropagation(); toggleSound(); }} aria-label={audioBlocked && soundEnabled ? "Allow sound" : soundEnabled ? "Mute sound" : "Unmute sound"} aria-pressed={soundEnabled} title={audioBlocked && soundEnabled ? "Your browser requires a tap to allow sound" : soundEnabled ? "Mute sound" : "Unmute sound"} className="absolute right-3 top-16 z-20 grid h-11 w-11 place-items-center rounded-md bg-transparent text-white/70 drop-shadow-[0_1px_3px_rgba(0,0,0,.9)] transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">{soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}{audioBlocked && soundEnabled ? <span className="absolute right-2 top-2 h-1 w-1 rounded-full bg-[#d4af37]" /> : null}</button> : null}
        {isAdmin ? <button onClick={onEdit} className="absolute bottom-3 right-3 z-30 flex items-center gap-1 rounded-full border border-white/15 bg-black/70 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-md hover:border-[#d4af37]/60"><Pencil className="h-3 w-3" /> Edit</button> : null}
      </div>
      {carousel ? <div className="carousel-tray absolute inset-x-0 top-full z-20 rounded-b-2xl border border-[#d4af37]/40 bg-[#101014]/95 p-3 shadow-gold backdrop-blur-xl" aria-label="Carousel thumbnails">
        <p className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-[#f1cf76]"><span>Explore this memory</span><span>{preview + 1} / {post.mediaItems.length}</span></p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {post.mediaItems.map((media, index) => <button key={media.id} onClick={() => choosePreview(index)} aria-label={"Preview carousel item " + (index + 1) + (media.mediaType === "VIDEO" ? ", video" : ", photo")} aria-pressed={preview === index} className={"relative h-16 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition " + (preview === index ? "border-[#d4af37]" : "border-transparent hover:border-white/70")}>
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
