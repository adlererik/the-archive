import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminMediaConsole } from "@/components/admin-console";
import { AdminShell } from "@/components/admin-shell";
import { ADMIN_COOKIE, isValidSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ at?: string }> }) {
  const jar = await cookies();
  if (!await isValidSession(jar.get(ADMIN_COOKIE)?.value)) redirect("/admin/login");
  const at = (await searchParams).at;
  const date = at ? new Date(at) : null;
  const initialDate = date && !Number.isNaN(date.valueOf()) ? date.toISOString() : undefined;
  return <AdminShell title="Preserve a memory" description="Add photos, arrange a carousel, and place it anywhere in your story." current="media"><AdminMediaConsole initialDate={initialDate} /></AdminShell>;
}
