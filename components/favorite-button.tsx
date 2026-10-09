"use client";
import { Star } from "lucide-react";
import { useFavorites } from "./favorites-provider";
export function FavoriteButton({ mediaId, compact = false }: { mediaId: string; compact?: boolean }) {
  const { ids, ready, toggle } = useFavorites(); const saved = ids.includes(mediaId);
  return <button disabled={!ready} type="button" onClick={event => { event.stopPropagation(); toggle(mediaId); }} aria-label={saved ? "Remove this item from favorites" : "Add this item to favorites"} aria-pressed={saved} title={saved ? "Remove from favorites" : "Add to favorites"} className={"inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border bg-black/80 px-3 text-sm backdrop-blur-md disabled:opacity-50 " + (saved ? "border-[#d4af37]/60 text-[#f4d77e]" : "border-white/25 text-white")}><Star className={"h-4 w-4 " + (saved ? "fill-current" : "")} />{compact ? null : saved ? "Saved" : "Favorite"}</button>;
}
