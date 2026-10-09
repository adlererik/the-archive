import { cookies } from "next/headers";
import { ArchiveWall } from "@/components/archive-wall";
import { ADMIN_COOKIE, isValidSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toArchivePost } from "@/lib/archive";
import { encodeCursor } from "@/lib/pagination";
import { getHeader } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const jar = await cookies();
  const isAdmin = await isValidSession(jar.get(ADMIN_COOKIE)?.value);
  const posts = await prisma.post.findMany({
    take: 33,
    orderBy: [{ takenAt: "desc" }, { id: "desc" }],
    include: { mediaItems: { orderBy: { position: "asc" } } },
  });

  const page = posts.slice(0, 32);
  const last = page.at(-1);
  return <ArchiveWall header={await getHeader()} initialPosts={page.map(toArchivePost)} initialCursor={posts.length > 32 && last ? encodeCursor(last) : null} isAdmin={isAdmin} />;
}
