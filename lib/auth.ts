import { createHmac, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { prisma } from "./prisma";
import { sessionSecret } from "./session-secret";

export const ADMIN_COOKIE = "archive_admin";
const derive = promisify(scrypt);
function equal(a: string, b: string) { return Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b)); }

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await derive(password, salt, 64) as Buffer;
  return "scrypt:" + salt + ":" + key.toString("hex");
}
export async function passwordMatches(password: unknown, hash: string) {
  if (typeof password !== "string" || password.length > 1024) return false;
  const [algorithm, salt, encoded] = hash.split(":");
  if (algorithm !== "scrypt" || !salt || !encoded) return false;
  const key = await derive(password, salt, 64) as Buffer;
  return equal(key.toString("hex"), encoded);
}
export async function getAdminAccount() {
  const account = await prisma.adminAccount.findUnique({ where: { id: "admin" } });
  if (account) return account;
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 8 || password === "set-your-own-password") throw new Error("Configure your own ADMIN_PASSWORD in .env.local before first login.");
  const passwordHash = await hashPassword(password);
  return prisma.adminAccount.upsert({ where: { id: "admin" }, update: {}, create: { id: "admin", username: process.env.ADMIN_USERNAME || "admin", passwordHash } });
}
export async function credentialsMatch(username: unknown, password: unknown) {
  const account = await getAdminAccount();
  const validPassword = await passwordMatches(password, account.passwordHash);
  return typeof username === "string" && equal(username.trim(), account.username) && validPassword;
}

function signature(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

export async function createSessionToken() {
  const account = await getAdminAccount();
  const expires = Date.now() + 1000 * 60 * 60 * 24 * 14;
  const value = "v3:" + expires + ":" + account.sessionVersion + ":" + randomBytes(16).toString("hex");
  return value + "." + signature(value);
}

export async function isValidSession(token?: string) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [value, supplied] = parts;
  if (!value || !supplied) return false;
  const [version, expires, revision] = value.split(":");
  if (!Number.isFinite(Number(expires)) || Number(expires) <= Date.now()) return false;
  const expected = signature(value);
  if (Buffer.byteLength(supplied) !== Buffer.byteLength(expected)) return false;
  if (!timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return false;
  const account = await getAdminAccount();
  return version === "v3" ? revision === account.sessionVersion : version === "v2" && account.sessionVersion === "bootstrap";
}

export const adminCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  // Local Wi-Fi access uses HTTP. Enable this explicitly when served through HTTPS.
  secure: process.env.SESSION_COOKIE_SECURE === "true",
  path: "/",
  maxAge: 60 * 60 * 24 * 14,
};
