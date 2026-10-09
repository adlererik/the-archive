export type ArchiveTheme = "gold" | "graphite";
export const themeStorageKey = "archive.theme.v1";

// Erik Adler: apply the saved palette before first paint, without changing any media colors.
export const themeBootstrap = `try{document.documentElement.dataset.theme=localStorage.getItem("${themeStorageKey}")==="graphite"?"graphite":"gold"}catch{}`;
