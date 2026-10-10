import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { SharedViewer } from "@/components/shared-viewer";
import { loadSharedSelection } from "@/lib/shared-links";
import { getHeader } from "@/lib/settings";
import { mediaUrl } from "@/lib/archive";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const selection = await loadSharedSelection(token);
  if (!selection) return { title: "Link unavailable", robots: { index: false, follow: false } };
  const jar = await headers();
  const host = jar.get("host") || "localhost:3000";
  const configured = process.env.ARCHIVE_PUBLIC_ORIGIN || process.env.CLOUDFLARE_ACCESS_HOSTNAME;
  const origin = configured ? (configured.startsWith("http") ? configured : "https://" + configured) : (jar.get("x-forwarded-proto") === "https" ? "https://" : "http://") + host;
  const site = await getHeader();
  const first = selection.items[0];
  const title = selection.kind === "presentation" ? site.title + " · A presentation for you" : first.caption.slice(0, 100) || site.title + " · A memory for you";
  const description = selection.kind === "presentation" ? selection.items.length + " photos and videos, ready to watch." : first.caption.slice(0, 240) || "Open this photo or video from " + site.title + ".";
  const preview = selection.items.find(item => item.thumbnail || item.mediaType === "IMAGE");
  const image = preview?.thumbnail || (preview?.mediaType === "IMAGE" ? preview.fileName : null);
  const images = image ? [{ url: new URL(mediaUrl(image), origin).href, alt: title }] : [];
  const url = new URL("/s/" + token, origin).href;
  return { title, description, robots: { index: false, follow: false }, alternates: { canonical: url }, openGraph: { type: "website", title, description, url, siteName: site.title, images }, twitter: { card: images.length ? "summary_large_image" : "summary", title, description, images: images.map(value => value.url) } };
}
export default async function SharedPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const selection = await loadSharedSelection(token);
  if (!selection) notFound();
  return <SharedViewer key={token} items={selection.items} kind={selection.kind} photoSeconds={selection.seconds} loop={selection.loop} />;
}
