"use client";

import { Play, Rows3 } from "lucide-react";
import { useCallback, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { ArchivePost } from "@/lib/archive";
import { mediaUrl } from "@/lib/archive";
import { FavoriteButton } from "./favorite-button";
import { useFavorites } from "./favorites-provider";

const thumbnailWidth = 56; // Match the carousel's w-14 previews.
const thumbnailHeight = 64;
const gap = 4;
const rowHeight = thumbnailHeight + gap;
const overscan = 5;

type Props = {
  posts: ArchivePost[];
  loading: boolean;
  hasMore: boolean;
  onOpen: (post: ArchivePost, mediaIndex: number) => void;
  onTimeline: () => void;
};

// Erik Adler: index every carousel asset, while mounting only nearby thumbnail rows.
export function ThumbnailWall({ posts, loading, hasMore, onOpen, onTimeline }: Props) {
  const favorites = useFavorites();
  const surface = useRef<HTMLElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef<string | null>(null);
  const [windowRows, setWindowRows] = useState({ columns: 1, first: 0, last: 20 });
  const items = useMemo(() => posts.flatMap(post => post.mediaItems.map((media, mediaIndex) => ({ post, media, mediaIndex }))), [posts]);
  const years = useMemo(() => [...new Set(items.map(item => new Date(item.post.takenAt).getFullYear()))], [items]);
  const totalRows = Math.ceil(items.length / windowRows.columns);
  const dateFormat = useMemo(() => new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }), []);

  const measure = useCallback(() => {
    const node = surface.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const columns = Math.max(1, Math.floor((rect.width + gap) / (thumbnailWidth + gap)));
    const rows = Math.ceil(items.length / columns);
    const visibleFirst = Math.floor(Math.max(0, -rect.top) / rowHeight);
    const first = Math.max(0, Math.min(rows, visibleFirst - overscan));
    const last = Math.min(rows, Math.ceil(Math.max(0, innerHeight - rect.top) / rowHeight) + overscan);
    setWindowRows(current => current.columns === columns && current.first === first && current.last === last ? current : { columns, first, last });
  }, [items.length]);

  useLayoutEffect(() => {
    let frame = 0;
    const schedule = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; measure(); }); };
    const observer = new ResizeObserver(schedule);
    if (surface.current) observer.observe(surface.current);
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, [measure]);

  useLayoutEffect(() => {
    if (!pendingFocus.current) return;
    const button = buttons.current.get(pendingFocus.current);
    if (button) { button.focus({ preventScroll: true }); pendingFocus.current = null; }
  }, [windowRows]);

  function reveal(index: number, focus = false) {
    const item = items[index];
    const node = surface.current;
    if (!item || !node) return;
    const row = Math.floor(index / windowRows.columns);
    if (focus) pendingFocus.current = item.media.id;
    const top = node.getBoundingClientRect().top + window.scrollY + row * rowHeight - (toolbar.current?.offsetHeight || 0) - 8;
    window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
    measure();
    // An already-mounted item needs no React update to receive focus.
    const button = buttons.current.get(item.media.id);
    if (focus && button) { button.focus({ preventScroll: true }); pendingFocus.current = null; }
  }

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -windowRows.columns, ArrowDown: windowRows.columns };
    const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : event.key in moves ? index + moves[event.key] : null;
    if (next === null) return;
    event.preventDefault();
    const destination = Math.max(0, Math.min(items.length - 1, next));
    const button = buttons.current.get(items[destination]?.media.id);
    if (button) button.focus({ preventScroll: false }); else reveal(destination, true);
  }

  return <div>
    <div ref={toolbar} className="sticky top-0 z-30 mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#d4af37]/25 bg-[#070709]/95 py-3 backdrop-blur-xl">
      <div><h2 className="text-sm font-medium text-white">Thumbnail wall</h2><p role="status" className="mt-1 text-xs text-white/55">{items.length.toLocaleString()} photos & videos{hasMore || loading ? " · Finding older memories…" : " · Newest first"}</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex min-h-11 items-center gap-2 text-xs text-white/70">Jump to year<select value="" onChange={event => { const year = Number(event.target.value); reveal(items.findIndex(item => new Date(item.post.takenAt).getFullYear() === year)); }} className="min-h-11 rounded-full border border-white/20 bg-[#141418] px-3 text-white" aria-label="Jump to a year in the thumbnail wall"><option value="" disabled>Choose year</option>{years.map(year => <option key={year} value={year}>{year}</option>)}</select></label>
        <button type="button" onClick={onTimeline} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-xs text-white/80"><Rows3 className="h-4 w-4" /> Timeline</button>
      </div>
    </div>
    {favorites.error ? <p role="status" className="mb-3 text-sm text-studio-soft">{favorites.error}</p> : null}
    <section ref={surface} aria-label="All photos and videos, including every carousel item" className="relative w-full" style={{ height: Math.max(thumbnailHeight, totalRows * rowHeight - gap) }}>
      <div className="absolute inset-x-0 grid gap-1" style={{ top: windowRows.first * rowHeight, gridTemplateColumns: `repeat(${windowRows.columns}, minmax(0, 1fr))` }}>
        {items.slice(windowRows.first * windowRows.columns, windowRows.last * windowRows.columns).map(({ post, media, mediaIndex }, offset) => {
          const index = windowRows.first * windowRows.columns + offset;
          const date = dateFormat.format(new Date(post.takenAt));
          const label = `${media.mediaType === "VIDEO" ? "Video" : "Photo"} from ${date}${post.mediaItems.length > 1 ? `, item ${mediaIndex + 1} of ${post.mediaItems.length}` : ""}`;
          return <article key={media.id} className="thumbnail-tile group relative h-16 min-w-0 overflow-hidden rounded-md border border-[#d4af37]/20 bg-white/[.03] hover:border-[#d4af37]/70 focus-within:border-[#d4af37]/70">
            <button type="button" ref={node => { if (node) buttons.current.set(media.id, node); else buttons.current.delete(media.id); }} onClick={() => onOpen(post, mediaIndex)} onKeyDown={event => navigate(event, index)} aria-label={"Open " + label.toLowerCase()} title={label + (post.caption ? "\n" + post.caption.slice(0, 160) : "")} className="block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#d4af37]">
              {media.thumbnail || media.mediaType === "IMAGE" ? <img src={mediaUrl(media.thumbnail || media.fileName)} alt="" loading="lazy" decoding="async" draggable={false} width={thumbnailWidth} height={thumbnailHeight} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center bg-zinc-900"><Play className="h-5 w-5 text-white/70" /></span>}
              {media.mediaType === "VIDEO" ? <span className="pointer-events-none absolute left-0 top-0 rounded-br bg-black/75 p-1 text-white"><Play className="h-2.5 w-2.5 fill-current" /></span> : null}
            </button>
            <div className="absolute bottom-0 right-0"><FavoriteButton mediaId={media.id} compact thumbnail /></div>
          </article>;
        })}
      </div>
    </section>
    {!hasMore && items.length ? <p className="mt-4 text-center text-xs text-white/45">All {items.length.toLocaleString()} items. Tap a star to save it; open a thumbnail to explore its memory.</p> : null}
  </div>;
}
