import { MoveLeft, Settings, SquarePlus, UnlockKeyhole } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function AdminShell({ title, description, current, children }: { title: string; description: string; current: "media" | "settings"; children: ReactNode }) {
  return <main className="page-glow relative min-h-screen px-4 py-8 sm:px-8 lg:px-12">
    <div className="header-admin-control"><form action="/api/admin/logout" method="post"><button type="submit" className="gallery-icon-button" aria-label="Log out of admin" title="Log out of admin"><UnlockKeyhole aria-hidden="true" className="h-5 w-5" strokeWidth={1.6} /></button></form></div>
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <div className="gallery-divider border-b border-white/[.08] pb-6 pr-14">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-white/45 hover:text-white"><MoveLeft aria-hidden="true" className="h-4 w-4" /> Back to wall</Link>
          <h1 className="mt-5 font-editorial text-4xl sm:text-5xl">{title}</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55">{description}</p>
        </div>
        <nav className="gallery-toolbar -ml-2.5 mt-2" aria-label="Administration">
          <Link href="/admin" className="gallery-icon-button" aria-current={current === "media" ? "page" : undefined} aria-label="Add memory" title="Add memory"><SquarePlus aria-hidden="true" className="h-5 w-5" strokeWidth={1.6} /></Link>
          <Link href="/admin/settings" className="gallery-icon-button gallery-settings-link" aria-current={current === "settings" ? "page" : undefined} aria-label="Archive settings" title="Archive settings"><Settings aria-hidden="true" className="h-5 w-5" strokeWidth={1.6} /></Link>
        </nav>
      </header>
      {children}
    </div>
  </main>;
}
