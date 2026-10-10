export const archiveThemes = [
  { id: "gold", name: "Gold", description: "Obsidian · champagne · the original", swatch: "#9f7738", background: "#070709" },
  { id: "graphite", name: "Graphite", description: "Carbon · silver · studio precision", swatch: "#41464e", background: "#070709" },
  { id: "porcelain", name: "Porcelain", description: "Warm paper · bronze · daylight gallery", swatch: "#e6dccc", background: "#f6f3ec" },
  { id: "midnight", name: "Midnight", description: "Deep indigo · moonlight · cinematic", swatch: "#576b98", background: "#080d19" },
  { id: "verdant", name: "Verdant", description: "Forest · sage · quiet sophistication", swatch: "#748879", background: "#0b1411" },
] as const;
export type ArchiveTheme = typeof archiveThemes[number]["id"];
export const themeStorageKey = "archive.theme.v1";
export function validTheme(value: unknown): ArchiveTheme { return archiveThemes.some(theme => theme.id === value) ? value as ArchiveTheme : "gold"; }
// Erik Adler: apply saved lighting before first paint; the photographs retain their original colors.
export const themeBootstrap = `try{var t=localStorage.getItem("${themeStorageKey}");document.documentElement.dataset.theme=${JSON.stringify(archiveThemes.map(theme => theme.id))}.includes(t)?t:"gold"}catch{}`;
