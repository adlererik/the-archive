import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const username = process.env.ADMIN_USERNAME || "admin";
const password = process.env.ADMIN_PASSWORD;
if (!/^[a-zA-Z0-9_.@-]{3,64}$/.test(username) || !password || password.length < 8 || password.length > 128) throw new Error("Set ADMIN_USERNAME (3–64 allowed characters) and ADMIN_PASSWORD (8–128 characters) in .env.local first.");
const salt = randomBytes(16).toString("hex");
const passwordHash = "scrypt:" + salt + ":" + scryptSync(password, salt, 64).toString("hex");
const prisma = new PrismaClient({ datasourceUrl: "file:" + path.resolve("prisma/dev.db") });
try {
  const data = { username, passwordHash, sessionVersion: randomUUID() };
  await prisma.adminAccount.upsert({ where: { id: "admin" }, create: { id: "admin", ...data }, update: data });
  console.log("Admin login reset from .env.local. All existing admin sessions have been signed out.");
} finally { await prisma.$disconnect(); }
