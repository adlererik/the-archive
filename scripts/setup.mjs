// Erik Adler: initialize a private, empty installation without shared passwords.
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (Number(process.versions.node.split(".")[0]) < 24) throw new Error("Node.js 24 or newer is required.");
const birth = new Date();
birth.setUTCFullYear(birth.getUTCFullYear() - 12);
const settings = [
  'DATABASE_URL="file:./dev.db"',
  'ADMIN_USERNAME="admin"',
  'ADMIN_PASSWORD="' + randomBytes(24).toString("base64url") + '"',
  'SESSION_SECRET="' + randomBytes(48).toString("hex") + '"',
  'NEXT_PUBLIC_BIRTH_DATE="' + birth.toISOString().slice(0, 10) + '"',
  'SESSION_COOKIE_SECURE="false"',
  'TRUST_PROXY="false"',
];
try {
  await writeFile(path.join(root, ".env.local"), settings.join("\n") + "\n", { flag: "wx", mode: 0o600 });
  console.log("Created private .env.local with a unique admin password and session secret. Open that file locally to read your password and set the birth date. Username: admin.");
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  console.log("Existing .env.local preserved; existing accounts and media are not reset.");
}
// Prisma CLI loads .env, whereas Next.js loads .env.local. Keep the DB URL aligned.
const local = await readFile(path.join(root, ".env.local"), "utf8");
const database = local.split(/\r?\n/).find(line => /^DATABASE_URL=/.test(line));
if (!database) throw new Error("Set DATABASE_URL in .env.local before continuing.");
try {
  await writeFile(path.join(root, ".env"), database + "\n", { flag: "wx", mode: 0o600 });
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  const existing = await readFile(path.join(root, ".env"), "utf8");
  const current = existing.split(/\r?\n/).find(line => /^DATABASE_URL=/.test(line));
  if (current !== database) throw new Error("DATABASE_URL differs between .env and .env.local. Align those settings manually; setup will not overwrite them.");
}
await mkdir(path.join(root, "prisma"), { recursive: true });
await mkdir(path.join(root, "public/uploads"), { recursive: true });
// The pinned SQLite schema engine needs an existing file on first initialization.
// Create only the default empty database, exclusively; never truncate an archive.
if (/^DATABASE_URL=["']?file:\.\/dev\.db["']?$/.test(database)) {
  try {
    await writeFile(path.join(root, "prisma/dev.db"), "", { flag: "wx", mode: 0o600 });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
}
console.log("Environment ready. Database schema creation never accepts destructive resets automatically.");
