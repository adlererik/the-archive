import { LogOut, MoveLeft } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminConsole } from "@/components/admin-console";
import { ADMIN_COOKIE, getAdminAccount, isValidSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getHeader } from "@/lib/settings";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ at?: string }> }) {
  const at = (await searchParams).at;
  const date = at ? new Date(at) : null;
  const initialDate = date && !Number.isNaN(date.valueOf()) ? date.toISOString() : undefined;
  const jar = await cookies();
  if (!await isValidSession(jar.get(ADMIN_COOKIE)?.value)) redirect("/admin/login");
  const account = await getAdminAccount();
  const [header, visits, visitCount, visitors, cities, posts, media, hearts, devices, documents] = await Promise.all([
    getHeader(), prisma.visit.findMany({ orderBy: { createdAt: "desc" }, take: 50, select: { id: true, city: true, country: true, region: true, device: true, os: true, browser: true, language: true, referrer: true, userAgent: true, createdAt: true } }), prisma.visit.count(),
    prisma.visit.groupBy({ by: ["visitorKey"] }), prisma.visit.groupBy({ by: ["city", "country"], where: { city: { not: "" } } }), prisma.post.count(), prisma.mediaItem.count(), prisma.postLike.count(),
    prisma.visit.groupBy({ by: ["device"], _count: { _all: true } }),
    Promise.all([{ title: "Carousel editing, soundtracks & themes", file: "CAROUSELS-SOUNDTRACKS-THEMES.md" }, { title: "Beginner setup — step by step", file: "BEGINNER-GUIDE.md" }, { title: "All features", file: "FEATURES.md" }, { title: "Cloudflare HTTPS & custom domains", file: "CLOUDFLARE.md" }, { title: "Public installation & deployment", file: "PUBLIC-SETUP.md" }, { title: "Operations & server migration", file: "OPERATIONS.md" }, { title: "Login and administration", file: "ADMIN.md" }, { title: "Favorites, Google Cast & AirPlay", file: "FAVORITES-CASTING.md" }, { title: "Architecture", file: "ARCHITECTURE.md" }, { title: "Development notes — Erik Adler", file: "CHANGELOG.md" }].map(async doc => ({ title: doc.title, content: await readFile(path.join(process.cwd(), "docs", doc.file), "utf8").catch(() => "Documentation file is missing from docs/. Include that folder when moving the archive.") }))),
  ]);
  return <main className="page-glow min-h-screen px-4 py-8 sm:px-8 lg:px-12"><div className="mx-auto max-w-5xl"><header className="mb-10 flex items-start justify-between gap-5 border-b border-white/[.08] pb-7"><div><Link href="/" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-white/45 hover:text-white"><MoveLeft className="h-4 w-4" /> Back to wall</Link><p className="mt-8 text-xs font-semibold uppercase tracking-[.24em] text-studio-accent">Private management</p><h1 className="mt-2 font-editorial text-5xl">Manage your archive</h1><p className="mt-3 max-w-xl text-white/55">Preserve memories, shape the wall, and understand your visitors.</p></div><form action="/api/admin/logout" method="post"><button className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 hover:text-white"><LogOut className="h-4 w-4" /> Sign out</button></form></header><AdminConsole initialDate={initialDate} username={account.username} header={header} visits={visits.map(v => ({ ...v, createdAt: v.createdAt.toISOString() }))} stats={{ visits: visitCount, visitors: visitors.length, cities: cities.length, posts, media, hearts }} breakdown={devices.map(d => ({ device: d.device, count: d._count._all }))} documents={documents} /></div></main>;
}
