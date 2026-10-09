"use client";
import { Star } from "lucide-react";
import { useFavorites } from "./favorites-provider";
export function FavoriteButton({ mediaId, compact = false, thumbnail = false }: { mediaId: string; compact?: boolean; thumbnail?: boolean }) {
  const { ids, ready, toggle } = useFavorites(); const saved = ids.includes(mediaId);
  return <button disabled={!ready} type="button" onClick={event => { event.stopPropagation(); toggle(mediaId); }} aria-label={saved ? "Remove this item from favorites" : "Add this item to favorites"} aria-pressed={saved} title={saved ? "Remove from favorites" : "Add to favorites"} className={(thumbnail ? "inline-flex h-7 w-7 items-center justify-center rounded-tl-md border-l border-t bg-black/75" : "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border bg-black/80 px-3 text-sm backdrop-blur-md") + " disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white " + (saved ? "border-[#d4af37]/60 text-studio-soft" : "border-white/25 text-white")}><Star className={(thumbnail ? "h-3 w-3 " : "h-4 w-4 ") + (saved ? "fill-current" : "")} />{compact || thumbnail ? null : saved ? "Saved" : "Favorite"}</button>;
}
