import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        obsidian: "#070709", champagne: "#D4AF37",
        "studio-accent": "rgb(var(--studio-accent) / <alpha-value>)",
        "studio-soft": "rgb(var(--studio-soft) / <alpha-value>)",
        "studio-counter": "rgb(var(--studio-counter) / <alpha-value>)",
        "studio-highlight": "rgb(var(--studio-highlight) / <alpha-value>)",
        "studio-play": "rgb(var(--studio-play) / <alpha-value>)",
        "studio-audio": "rgb(var(--studio-audio) / <alpha-value>)",
        "studio-date": "rgb(var(--studio-date) / <alpha-value>)",
        "studio-caption": "rgb(var(--studio-caption) / <alpha-value>)",
        "studio-fill": "rgb(var(--studio-fill) / <alpha-value>)",
        "studio-hover": "rgb(var(--studio-hover) / <alpha-value>)",
        "studio-save": "rgb(var(--studio-save) / <alpha-value>)",
      },
      fontFamily: { sans: ["var(--font-sans)"], serif: ["var(--font-serif)"] },
      boxShadow: { gold: "0 20px 40px -15px var(--studio-shadow)" },
    },
  },
  plugins: [],
};

export default config;
