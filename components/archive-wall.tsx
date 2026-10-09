"use client";

import { ArrowDown, Grid3X3, Plus, Rows3, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { ArchivePost } from "@/lib/archive";
import { EditPostModal } from "./edit-post-modal";
import { MediaCard } from "./media-card";
import { TheaterModal } from "./theater-modal";
import type { HeaderSettings } from "@/lib/settings";
import { useFavorites } from "./favorites-provider";
import { ThemeButton } from "./theme-button";
import { ThumbnailWall } from "./thumbnail-wall";

type Props = { header: HeaderSettings; initialPosts: ArchivePost[]; initialCursor: string | null; isAdmin: boolean };

export function ArchiveWall({ header, initialPosts, initialCursor, isAdmin }: Props) {
  const favorites = useFavorites();
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const loadingRef = useRef(false);
  const [editing, setEditing] = useState<ArchivePost | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"timeline" | "thumbnails">("timeline");
  const viewPositions = useRef({ timeline: 0, thumbnails: 0 });
  const viewerPosition = useRef(0);
  const positionFrame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(positionFrame.current), []);

  function restorePosition(top: number) {
    cancelAnimationFrame(positionFrame.current);
    positionFrame.current = requestAnimationFrame(() => window.scrollTo({ top, behavior: "instant" }));
  }

  function toggleView() {
    viewPositions.current[view] = window.scrollY;
    const next = view === "timeline" ? "thumbnails" : "timeline";
    flushSync(() => setView(next));
    restorePosition(viewPositions.current[next]);
  }

  function openPost(post: ArchivePost, mediaIndex: number) {
    viewerPosition.current = window.scrollY;
    flushSync(() => { setSelectedMedia(mediaIndex); setSelectedId(post.id); });
  }

  function closePost() {
    flushSync(() => setSelectedId(null));
    restorePosition(viewerPosition.current);
  }

  const loadMore = useCallback(async () => {
    if (!cursor || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setLoadError(false);
    try {
      const response = await fetch("/api/posts?cursor=" + encodeURIComponent(cursor), { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to retrieve memories");
      const data = await response.json() as { posts: ArchivePost[]; nextCursor: string | null };
      setPosts((current) => [...current, ...data.posts.filter((post) => !current.some((item) => item.id === post.id))]);
      setCursor(data.nextCursor);
    } catch {
      setLoadError(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [cursor]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !cursor || loadError || selectedId || view !== "timeline") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void loadMore();
    }, { rootMargin: "900px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, loadMore, loadError, selectedId, view]);

  // Erik Adler: finish the metadata index without making viewers scroll through years first.
  useEffect(() => {
    if (view === "thumbnails" && cursor && !loading && !loadError && !selectedId) void loadMore();
  }, [view, cursor, loading, loadError, selectedId, loadMore]);

  const selectedIndex = useMemo(() => posts.findIndex((post) => post.id === selectedId), [posts, selectedId]);
  const selected = selectedIndex >= 0 ? posts[selectedIndex] : null;

  function updatePost(next: ArchivePost) {
    setPosts((current) => current.map((post) => post.id === next.id ? next : post).sort((a, b) => +new Date(b.takenAt) - +new Date(a.takenAt)));
    setEditing(null);
  }

  function removePost(id: string) {
    setPosts((current) => current.filter((post) => post.id !== id));
    setEditing(null);
    setSelectedId(null);
  }

  return (
    <main className="page-glow min-h-screen overflow-x-clip px-4 pb-16 pt-6 sm:px-8 sm:pt-10 lg:px-12">
      <header className="gallery-divider mx-auto mb-12 flex max-w-[1740px] flex-col items-start justify-between gap-6 border-b border-white/[0.08] pb-7 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-studio-accent"><Sparkles className="h-3.5 w-3.5" /> {header.eyebrow}</div>
          <h1 className="font-editorial break-words text-5xl tracking-[-.045em] text-white sm:text-7xl">{header.title}</h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/55 sm:text-base">{header.description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <ThemeButton />
          <button type="button" onClick={toggleView} aria-pressed={view === "thumbnails"} title={view === "thumbnails" ? "Return to the timeline" : "Browse every image and video"} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d4af37]/35 px-4 text-xs text-white/80">{view === "thumbnails" ? <Rows3 className="h-4 w-4 text-studio-accent" /> : <Grid3X3 className="h-4 w-4 text-studio-accent" />}{view === "thumbnails" ? "Timeline" : "Thumbnail wall"}</button>
          <Link href="/favorites" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-xs text-white/80"><Star className="h-4 w-4 text-studio-accent" /> Favorites{favorites.ready && favorites.ids.length ? " · " + favorites.ids.length : ""}</Link>
          {isAdmin ? <Link href="/admin" className="flex items-center gap-2 rounded-full border border-[#d4af37]/50 bg-studio-fill/10 px-4 py-2 text-xs font-semibold text-studio-soft hover:bg-studio-fill/20"><Plus className="h-4 w-4" /> Add memory</Link> : null}
        </div>
      </header>

      {posts.length ? view === "thumbnails" ? <ThumbnailWall posts={posts} loading={loading} hasMore={Boolean(cursor)} onOpen={openPost} onTimeline={toggleView} /> : <section aria-label="Memories in chronological order" className="mx-auto grid max-w-[1740px] grid-cols-1 items-start gap-5 md:grid-cols-2 xl:grid-cols-4">{posts.map((post) => <MediaCard key={post.id} post={post} isAdmin={isAdmin} theaterOpen={Boolean(selectedId)} onOpen={(mediaIndex) => openPost(post, mediaIndex)} onEdit={() => setEditing(post)} />)}</section> : <div className="mx-auto max-w-lg py-32 text-center text-white/55"><p className="font-editorial text-3xl text-white">Awaiting the first memory.</p><p className="mt-3 text-sm">Sign in to add it to the collection.</p></div>}
      <div ref={sentinel} className="flex h-24 items-center justify-center" aria-live="polite">{loading ? <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/45"><ArrowDown className="h-4 w-4 animate-bounce" /> Retrieving the past</span> : null}</div>
      {loadError ? <p className="text-center text-sm text-white/60">The connection was interrupted. <button onClick={() => void loadMore()} className="text-studio-accent underline">Retry</button></p> : null}
      <p className="mt-6 text-center text-xs text-white/35">Visit statistics are stored locally for the archive owner. <Link href="/privacy" className="underline">Details</Link></p>

      {selected ? <TheaterModal key={selected.id} post={selected} initialMediaIndex={selectedMedia} posts={posts} onClose={closePost} onPrevious={() => flushSync(() => { setSelectedMedia(0); setSelectedId(posts[Math.max(0, selectedIndex - 1)]?.id ?? null); })} onNext={() => flushSync(() => { setSelectedMedia(0); setSelectedId(posts[Math.min(posts.length - 1, selectedIndex + 1)]?.id ?? null); })} /> : null}
      {editing ? <EditPostModal post={editing} onClose={() => setEditing(null)} onUpdated={updatePost} onDeleted={removePost} /> : null}
    </main>
  );
}
