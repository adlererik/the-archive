"use client";

import { ArrowDown, Grid3X3, LockKeyhole, Rows3, Settings, Sparkles, SquarePlus, UnlockKeyhole } from "lucide-react";
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

function FilmReelIcon() {
  return <svg aria-hidden="true" data-icon="film-reel" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10.5" cy="10.5" r="8.5" />
    <circle cx="10.5" cy="10.5" r="1" />
    <g fill="currentColor" stroke="none">
      <circle cx="10.5" cy="5.2" r="1.7" />
      <circle cx="15.5" cy="8.9" r="1.7" />
      <circle cx="13.6" cy="14.8" r="1.7" />
      <circle cx="7.4" cy="14.8" r="1.7" />
      <circle cx="5.5" cy="8.9" r="1.7" />
    </g>
    <path d="M10.5 19H19a3 3 0 0 0 3-3" />
  </svg>;
}

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
      setPosts((current) => [...current, ...data.posts.filter((post) => !current.some((item) => item.id === post.id))].sort((a, b) => +new Date(b.takenAt) - +new Date(a.takenAt) || b.id.localeCompare(a.id)));
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
    setPosts((current) => current.map((post) => post.id === next.id ? next : post).sort((a, b) => +new Date(b.takenAt) - +new Date(a.takenAt) || b.id.localeCompare(a.id)));
    setEditing(null);
  }

  function removePost(id: string) {
    setPosts((current) => current.filter((post) => post.id !== id));
    setEditing(null);
    setSelectedId(null);
  }

  return (
    <main className="page-glow relative min-h-screen overflow-x-clip px-4 pb-16 pt-6 sm:px-8 sm:pt-10 lg:px-12">
      <div className="header-admin-control">
        {isAdmin ? <form action="/api/admin/logout" method="post"><button type="submit" className="gallery-icon-button" aria-label="Log out of admin" title="Log out of admin"><UnlockKeyhole aria-hidden="true" className="h-5 w-5" strokeWidth={1.6} /></button></form> : <Link href="/admin" className="gallery-icon-button" aria-label="Log in to admin" title="Admin login"><LockKeyhole aria-hidden="true" className="h-5 w-5" strokeWidth={1.6} /></Link>}
      </div>
      <header className="mx-auto mb-8 max-w-[1740px]">
        <div className="gallery-divider min-w-0 border-b border-white/[0.08] pb-6 pr-14">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-studio-accent"><Sparkles className="h-3.5 w-3.5" /> {header.eyebrow}</div>
          <h1 className="font-editorial break-words text-5xl tracking-[-.045em] text-white sm:text-7xl">{header.title}</h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/55 sm:text-base">{header.description}</p>
        </div>
        <div className="gallery-toolbar -ml-2.5 mt-2" role="group" aria-label="Gallery controls">
          <ThemeButton iconOnly />
          <button type="button" onClick={toggleView} aria-label={view === "thumbnails" ? "Return to the timeline" : "Browse every image and video"} aria-pressed={view === "thumbnails"} title={view === "thumbnails" ? "Return to the timeline" : "Browse every image and video"} className="gallery-icon-button">{view === "thumbnails" ? <Rows3 aria-hidden="true" className="h-5 w-5" strokeWidth={1.6} /> : <Grid3X3 aria-hidden="true" className="h-5 w-5" strokeWidth={1.6} />}</button>
          <Link href="/favorites" className="gallery-icon-button gallery-presentation-link" aria-label={"Presentation selection" + (favorites.ready ? ": " + favorites.ids.length + " selected" : "")} title="Presentation selection"><FilmReelIcon />{favorites.ready ? <span className="gallery-selection-count" aria-hidden="true">{favorites.ids.length}</span> : null}</Link>
          {isAdmin ? <Link href="/admin" className="gallery-icon-button" aria-label="Add memory" title="Add memory"><SquarePlus aria-hidden="true" className="h-5 w-5" strokeWidth={1.6} /></Link> : null}
          {isAdmin ? <Link href="/admin/settings" className="gallery-icon-button gallery-settings-link" aria-label="Archive settings" title="Archive settings"><Settings aria-hidden="true" className="h-5 w-5" strokeWidth={1.6} /></Link> : null}
        </div>
      </header>

      {posts.length ? view === "thumbnails" ? <ThumbnailWall posts={posts} loading={loading} hasMore={Boolean(cursor)} onOpen={openPost} onTimeline={toggleView} /> : <section aria-label="Memories in chronological order" className="mx-auto grid max-w-[1740px] grid-cols-1 items-start gap-5 md:grid-cols-2 xl:grid-cols-4">{posts.map((post) => <MediaCard key={post.id} post={post} isAdmin={isAdmin} theaterOpen={Boolean(selectedId || editing)} onOpen={(mediaIndex) => openPost(post, mediaIndex)} onEdit={() => setEditing(post)} />)}</section> : <div className="mx-auto max-w-lg py-32 text-center text-white/55"><p className="font-editorial text-3xl text-white">Awaiting the first memory.</p><p className="mt-3 text-sm">Sign in to add it to the collection.</p></div>}
      <div ref={sentinel} className="flex h-24 items-center justify-center" aria-live="polite">{loading ? <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/45"><ArrowDown className="h-4 w-4 animate-bounce" /> Retrieving the past</span> : null}</div>
      {loadError ? <p className="text-center text-sm text-white/60">The connection was interrupted. <button onClick={() => void loadMore()} className="text-studio-accent underline">Retry</button></p> : null}
      <p className="mt-6 text-center text-xs text-white/35">Visit statistics are stored locally for the archive owner. <Link href="/privacy" className="underline">Details</Link></p>

      {selected ? <TheaterModal key={selected.id} post={selected} initialMediaIndex={selectedMedia} posts={posts} onClose={closePost} onPrevious={() => flushSync(() => { setSelectedMedia(0); setSelectedId(posts[Math.max(0, selectedIndex - 1)]?.id ?? null); })} onNext={() => flushSync(() => { setSelectedMedia(0); setSelectedId(posts[Math.min(posts.length - 1, selectedIndex + 1)]?.id ?? null); })} /> : null}
      {editing ? <EditPostModal post={editing} onClose={() => setEditing(null)} onUpdated={updatePost} onDeleted={removePost} /> : null}
    </main>
  );
}
