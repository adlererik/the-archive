import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: { obsidian: "#070709", champagne: "#D4AF37" },
      fontFamily: { sans: ["var(--font-sans)"], serif: ["var(--font-serif)"] },
      boxShadow: { gold: "0 20px 40px -15px rgba(212,175,55,0.35)" },
    },
  },
  plugins: [],
};

export default config;
