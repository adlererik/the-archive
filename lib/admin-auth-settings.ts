import { mkdir, readFile, rename, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";

export type AdminAuthMode = "password" | "cloudflare";
export type AdminAuthSettings = { mode: AdminAuthMode; cloudflareConfigured: boolean };
const settingsPath = () => path.join(process.cwd(), ".runtime", "admin-auth.json");

export async function getAdminAuthMode(): Promise<AdminAuthMode> {
  let mode: unknown = process.env.ADMIN_AUTH_MODE || "password";
  try {
    mode = JSON.parse(await readFile(settingsPath(), "utf8")).mode;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  if (mode !== "password" && mode !== "cloudflare") throw new Error("Invalid administrator authentication mode.");
  return mode;
}

export function getCloudflareAccessConfig() {
  const teamDomain = process.env.CLOUDFLARE_ACCESS_TEAM_DOMAIN || "";
  const audience = process.env.CLOUDFLARE_ACCESS_AUD || "";
  const email = process.env.CLOUDFLARE_ACCESS_EMAIL || "";
  const hostname = process.env.CLOUDFLARE_ACCESS_HOSTNAME || "";
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.cloudflareaccess\.com$/.test(teamDomain) || !/^[a-f0-9]{64}$/.test(audience) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(hostname) || !hostname.includes(".") || process.env.SESSION_COOKIE_SECURE !== "true") return null;
  return { teamDomain, audience, email, hostname };
}

export async function getAdminAuthSettings(): Promise<AdminAuthSettings> {
  return { mode: await getAdminAuthMode(), cloudflareConfigured: Boolean(getCloudflareAccessConfig()) };
}

export async function setAdminAuthMode(mode: AdminAuthMode) {
  await mkdir(path.dirname(settingsPath()), { recursive: true, mode: 0o700 });
  const temporary = settingsPath() + "." + randomUUID() + ".tmp";
  await writeFile(temporary, JSON.stringify({ mode }) + "\n", { mode: 0o600, flag: "wx" });
  await rename(temporary, settingsPath());
}
