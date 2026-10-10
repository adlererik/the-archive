import { createPublicKey, verify, type JsonWebKey } from "crypto";
import { getCloudflareAccessConfig } from "./admin-auth-settings";

type AccessClaims = { iss: string; aud: string | string[]; email: string; sub: string; exp: number; iat: number; nbf?: number; type?: string };
type AccessKey = JsonWebKey & { kid?: string; alg?: string; use?: string };
let cached: { team: string; expires: number; keys: AccessKey[] } | undefined;
let pending: Promise<AccessKey[]> | undefined;
let lastRefresh = 0;

async function signingKeys(team: string, refresh = false): Promise<AccessKey[]> {
  if (cached?.team === team && cached.expires > Date.now() && (!refresh || Date.now() - lastRefresh < 60000)) return cached.keys;
  if (pending) return pending;
  lastRefresh = Date.now();
  pending = (async () => {
    const response = await fetch(`https://${team}/cdn-cgi/access/certs`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error("Cloudflare signing keys are unavailable.");
    const data = await response.json();
    if (!Array.isArray(data.keys) || data.keys.length > 32) throw new Error("Invalid Cloudflare signing keys.");
    const keys: AccessKey[] = data.keys.filter((key: AccessKey) => key && key.kty === "RSA" && typeof key.kid === "string" && typeof key.n === "string" && typeof key.e === "string" && (!key.alg || key.alg === "RS256") && (!key.use || key.use === "sig"));
    cached = { team, keys, expires: Date.now() + 15 * 60000 };
    return keys;
  })();
  try { return await pending; } finally { pending = undefined; }
}

export async function validateCloudflareAccess(token: string | null, host: string | null): Promise<AccessClaims | null> {
  const config = getCloudflareAccessConfig();
  if (!config || host?.toLowerCase() !== config.hostname || !token || token.length > 20000 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return null;
  try {
    const [encodedHeader, encodedClaims, encodedSignature] = token.split(".");
    const header = JSON.parse(Buffer.from(encodedHeader, "base64url").toString("utf8"));
    const claims: AccessClaims = JSON.parse(Buffer.from(encodedClaims, "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    if (!header || header.alg !== "RS256" || header.crit !== undefined || (header.typ !== undefined && header.typ !== "JWT") || typeof header.kid !== "string" || header.kid.length > 256 || !claims || claims.iss !== `https://${config.teamDomain}` || claims.email !== config.email || typeof claims.sub !== "string" || !claims.sub || !Number.isSafeInteger(claims.exp) || claims.exp <= now || !Number.isSafeInteger(claims.iat) || claims.iat > now + 30 || claims.iat > claims.exp || (claims.nbf !== undefined && (!Number.isSafeInteger(claims.nbf) || claims.nbf > now + 30)) || (claims.type !== undefined && claims.type !== "app")) return null;
    const audiences = typeof claims.aud === "string" ? [claims.aud] : claims.aud;
    if (!Array.isArray(audiences) || !audiences.includes(config.audience)) return null;
    let keys = (await signingKeys(config.teamDomain)).filter(key => key.kid === header.kid);
    if (!keys.length) keys = (await signingKeys(config.teamDomain, true)).filter(key => key.kid === header.kid);
    if (keys.length !== 1) return null;
    const key = createPublicKey({ key: keys[0], format: "jwk" });
    return verify("RSA-SHA256", Buffer.from(encodedHeader + "." + encodedClaims), key, Buffer.from(encodedSignature, "base64url")) ? claims : null;
  } catch {
    return null;
  }
}
