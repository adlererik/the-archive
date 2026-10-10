"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { archiveThemes, validTheme, themeStorageKey as storageKey, type ArchiveTheme } from "@/lib/archive-theme";
const Context = createContext<{ theme: ArchiveTheme; setTheme: (theme: ArchiveTheme) => void } | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setCurrent] = useState<ArchiveTheme>("gold");
  useEffect(() => {
    setCurrent(validTheme(document.documentElement.dataset.theme));
    const changed = (event: StorageEvent) => {
      if (event.key !== storageKey && event.key !== null) return;
      const next = validTheme(event.newValue);
      document.documentElement.dataset.theme = next;
      setCurrent(next);
    };
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, []);
  function setTheme(next: ArchiveTheme) {
    document.documentElement.dataset.theme = next;
    setCurrent(next);
    try { localStorage.setItem(storageKey, next); } catch { /* Keep the palette for this visit if storage is unavailable. */ }
  }
  useEffect(() => {
    const color = archiveThemes.find(option => option.id === theme)?.background || "#070709";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color);
  }, [theme]);
  return <Context.Provider value={{ theme, setTheme }}>{children}</Context.Provider>;
}

export function useTheme() {
  const value = useContext(Context);
  if (!value) throw new Error("ThemeProvider is required");
  return value;
}
