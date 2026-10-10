import { redirect } from "next/navigation";
import { PasswordLogin } from "@/components/password-login";
import { getAdminAuthMode } from "@/lib/admin-auth-settings";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getAdminAuthMode() === "cloudflare") redirect("/api/admin/sso");
  return <PasswordLogin />;
}
