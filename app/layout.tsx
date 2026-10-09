import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { FavoritesProvider } from "@/components/favorites-provider";
import { CastProvider } from "@/components/cast-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { themeBootstrap } from "@/lib/archive-theme";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  title: "The Archive",
  description: "An enduring collection of moments.",
};

export const viewport: Viewport = {
  themeColor: "#070709",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="gold" suppressHydrationWarning>
      <body className={sans.variable + " " + serif.variable}><script dangerouslySetInnerHTML={{ __html: themeBootstrap }} /><ThemeProvider><FavoritesProvider><CastProvider>{children}</CastProvider></FavoritesProvider></ThemeProvider></body>
    </html>
  );
}
