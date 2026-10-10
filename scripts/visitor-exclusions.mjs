import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { isPublicAddress } from "./visitor-address.mjs";

const file = () => path.join(process.cwd(), ".runtime", "visitor-exclusions.json");
let writing = Promise.resolve();
export async function readVisitorExclusions() {
  try {
    const data = JSON.parse(await readFile(file(), "utf8"));
    return { ips: Array.isArray(data.ips) ? data.ips.filter(ip => typeof ip === "string" && isPublicAddress(ip)) : [], visitorKeys: Array.isArray(data.visitorKeys) ? data.visitorKeys.filter(key => typeof key === "string" && /^[A-Za-z0-9_-]{43}$/.test(key)) : [] };
  } catch (error) { if (error.code === "ENOENT") return { ips: [], visitorKeys: [] }; throw error; }
}
export async function rememberOwner(ip, visitorKey) {
  writing = writing.catch(() => {}).then(async () => {
    const data = await readVisitorExclusions();
    if ((!isPublicAddress(ip) || data.ips.includes(ip)) && data.visitorKeys.includes(visitorKey)) return;
    if (isPublicAddress(ip) && !data.ips.includes(ip)) data.ips.push(ip);
    if (!data.visitorKeys.includes(visitorKey)) data.visitorKeys.push(visitorKey);
    await mkdir(path.dirname(file()), { recursive: true, mode: 0o700 });
    const temporary = file() + ".tmp";
    await writeFile(temporary, JSON.stringify(data), { mode: 0o600 });
    await rename(temporary, file());
  });
  await writing;
}
export async function hasAdminSession(token, secret, prisma) {
  if (!token || token.length > 2048) return false;
  const [value, signature, extra] = token.split(".");
  if (!value || !signature || extra !== undefined) return false;
  const expected = createHmac("sha256", secret).update(value).digest("base64url");
  if (Buffer.byteLength(signature) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  const [version, expires, revision, source] = value.split(":");
  if (!Number.isFinite(Number(expires)) || Number(expires) <= Date.now()) return false;
  let mode = process.env.ADMIN_AUTH_MODE || "password";
  try { mode = JSON.parse(await readFile(path.join(process.cwd(), ".runtime", "admin-auth.json"), "utf8")).mode || mode; }
  catch (error) { if (error.code !== "ENOENT") return false; }
  if (mode === "cloudflare" ? version !== "v4" || source !== "cloudflare" : version === "v4") return false;
  const account = await prisma.adminAccount.findUnique({ where: { id: "admin" }, select: { sessionVersion: true } });
  return Boolean(account && (["v3", "v4"].includes(version) ? revision === account.sessionVersion : version === "v2" && account.sessionVersion === "bootstrap"));
}
