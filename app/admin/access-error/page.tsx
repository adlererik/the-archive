import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { getCloudflareAccessConfig } from "@/lib/admin-auth-settings";

export const dynamic = "force-dynamic";

export default function AccessErrorPage() {
  const config = getCloudflareAccessConfig();
  const retry = config ? `https://${config.hostname}/admin` : "/api/admin/sso";
  return <main className="page-glow grid min-h-screen place-items-center p-5"><section className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-white/[.035] p-8"><LockKeyhole className="h-6 w-6 text-studio-accent" /><h1 className="mt-6 font-editorial text-4xl">Unable to confirm your sign-in</h1><p className="mt-4 text-sm leading-relaxed text-white/60">Open the archive through its Cloudflare-protected address and use the owner’s approved account. If this continues, check the Cloudflare login configuration on your server.</p><div className="mt-6 flex flex-wrap gap-4 text-sm"><Link href={retry} className="text-studio-accent underline">Try again</Link><Link href="/" className="underline">Back to the gallery</Link></div></section></main>;
}
