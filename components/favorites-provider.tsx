"use client";
import { createContext, useContext, useEffect, useState } from "react";
const key = "archive.favorites.v1";
type Favorites = { ids: string[]; ready: boolean; error: string; toggle: (id: string) => void; remove: (id: string) => void; move: (id: string, delta: number) => void };
const Context = createContext<Favorites | null>(null);
function decode(raw: string | null): string[] {
  try { const value: unknown = JSON.parse(raw || "[]"); return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(id)))].slice(0, 1000) : []; } catch { return []; }
}
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]); const [ready, setReady] = useState(false); const [error, setError] = useState("");
  useEffect(() => { try { setIds(decode(localStorage.getItem(key))); } catch { setError("Your browser cannot save favorites. This list will last only for this visit."); } setReady(true); const changed = (event: StorageEvent) => { if (event.key === key) setIds(decode(event.newValue)); }; window.addEventListener("storage", changed); return () => window.removeEventListener("storage", changed); }, []);
  function update(change: (current: string[]) => string[]) { setIds(current => { const next = change(current); try { localStorage.setItem(key, JSON.stringify(next)); } catch { setError("Your browser cannot save favorites. This list will last only for this visit."); } return next; }); }
  return <Context.Provider value={{ ids, ready, error, toggle: id => update(current => current.includes(id) ? current.filter(item => item !== id) : current.length < 1000 ? [...current, id] : current), remove: id => update(current => current.filter(item => item !== id)), move: (id, delta) => update(current => { const next = [...current]; const index = next.indexOf(id); const destination = index + delta; if (index >= 0 && destination >= 0 && destination < next.length) [next[index], next[destination]] = [next[destination], next[index]]; return next; }) }}>{children}</Context.Provider>;
}
export function useFavorites() { const value = useContext(Context); if (!value) throw new Error("FavoritesProvider is required"); return value; }
