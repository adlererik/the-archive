import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { chmod, lstat, mkdir, unlink, writeFile } from "node:fs/promises";
import { createServer, createConnection } from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const work = path.join(root, "work");
let socketPath = path.join(work, "archive-server.sock");
// Unix sockets have short path limits; long checkout paths still need controls.
if (Buffer.byteLength(socketPath) > 100) {
  const uid = process.getuid();
  const name = "the-archive-" + uid + "-" + createHash("sha256").update(root).digest("hex").slice(0, 24);
  const directory = path.join(os.tmpdir(), name);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const info = await lstat(directory);
  if (!info.isDirectory() || info.uid !== uid) throw new Error("Unsafe launcher control directory.");
  await chmod(directory, 0o700);
  socketPath = path.join(directory, "server.sock");
}
const next = path.join(root, "node_modules/next/dist/bin/next");
const prisma = path.join(root, "node_modules/prisma/build/index.js");
const packageManager = path.join(work, "toolchain/pnpm/bin/pnpm.mjs");
const env = { ...process.env, PATH: path.dirname(process.execPath) + path.delimiter + (process.env.PATH || ""), PNPM_HOME: path.join(work, "pnpm-home"), XDG_DATA_HOME: path.join(work, "xdg"), XDG_CACHE_HOME: path.join(work, "xdg-cache"), XDG_CONFIG_HOME: path.join(work, "xdg-config"), NEXT_TELEMETRY_DISABLED: "1" };
await mkdir(work, { recursive: true });
env.XDG_RUNTIME_DIR = path.join(work, "runtime");
await mkdir(env.XDG_RUNTIME_DIR, { recursive: true, mode: 0o700 });
await chmod(env.XDG_RUNTIME_DIR, 0o700);

async function run(file, args = []) {
  await runCommand(process.execPath, [file, ...args]);
}

async function runCommand(executable, args = []) {
  const child = spawn(executable, args, { cwd: root, env, stdio: "inherit" });
  const result = await new Promise((resolve, reject) => { child.on("error", reject); child.on("exit", (code) => resolve(code)); });
  if (result !== 0) throw new Error("Command failed with exit code " + result);
}

async function dependencies(args) {
  if (existsSync(packageManager)) await run(packageManager, args);
  else await runCommand("pnpm", args);
}

async function control(command) {
  return new Promise((resolve) => {
    const connection = createConnection(socketPath);
    let response = "";
    connection.setTimeout(25_000);
    connection.on("connect", () => connection.write(JSON.stringify({ command }) + "\n"));
    connection.on("data", (data) => { response += data; if (response.includes("\n")) connection.end(); });
    connection.on("end", () => { try { resolve(JSON.parse(response)); } catch { resolve(null); } });
    connection.on("error", () => { connection.destroy(); resolve(null); });
    connection.on("timeout", () => { connection.destroy(); resolve(null); });
  });
}

function available(port) {
  return new Promise((resolve) => { const probe = createServer(); probe.once("error", () => resolve(false)); probe.listen(port, "0.0.0.0", () => probe.close(() => resolve(true))); });
}

function addresses(port) {
  const links = ["http://localhost:" + port];
  for (const entries of Object.values(os.networkInterfaces())) for (const entry of entries || []) if (entry.family === "IPv4" && !entry.internal) links.push("http://" + entry.address + ":" + port);
  return links;
}

async function supervise() {
  const old = await control("status");
  if (old?.ok) { console.log("The Archive is already running. " + old.urls.join(" · ")); return; }
  if (existsSync(socketPath)) await unlink(socketPath);
  let child, port;
  let stopping = false, busy = false;

  async function stopChild() {
    if (!child || child.exitCode !== null || child.signalCode !== null) return;
    const target = child;
    await new Promise((resolve) => { const timer = setTimeout(() => target.kill("SIGKILL"), 8_000); target.once("exit", () => { clearTimeout(timer); resolve(); }); target.kill("SIGTERM"); });
  }

  async function startChild() {
    const requested = Number(process.env.ARCHIVE_PORT || "3000");
    if (!Number.isInteger(requested) || requested < 1 || requested > 65535) throw new Error("ARCHIVE_PORT must be a port number from 1 to 65535.");
    if (!await available(requested)) throw new Error("Port " + requested + " is busy. Stop the existing server before starting The Archive.");
    port = requested;
    child = spawn(process.execPath, [path.join(root, "scripts/server.mjs")], { cwd: root, env: { ...env, ARCHIVE_PORT: String(port), NODE_ENV: "production" }, stdio: ["ignore", "inherit", "inherit"] });
    child.once("error", (error) => console.error(error.message));
    for (let attempt = 0; attempt < 60; attempt++) {
      if (child.exitCode !== null || child.signalCode !== null) throw new Error("The server exited before it became ready.");
      try {
        const response = await fetch("http://127.0.0.1:" + port + "/api/posts?limit=1", { signal: AbortSignal.timeout(1000) });
        if (response.ok) { const state = { ok: true, port, urls: addresses(port) }; await writeFile(path.join(work, "archive-server.json"), JSON.stringify(state, null, 2)); console.log("The Archive is ready: " + state.urls.join(" · ")); return state; }
      } catch { /* Wait until Next.js is ready. */ }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw new Error("The server did not become ready in time.");
  }

  const controlServer = createServer((connection) => {
    let request = "", handled = false;
    connection.on("data", async (data) => {
      request += data;
      if (!request.includes("\n") || handled) return;
      handled = true;
      try {
        const { command } = JSON.parse(request);
        if (command === "status") { connection.end(JSON.stringify({ ok: Boolean(child && child.exitCode === null && child.signalCode === null), port, urls: addresses(port) }) + "\n"); return; }
        if (busy) { connection.end(JSON.stringify({ ok: false, error: "A restart is already in progress." }) + "\n"); return; }
        busy = true;
        if (command === "restart") { await stopChild(); const state = await startChild(); connection.end(JSON.stringify(state) + "\n"); }
        else if (command === "stop") { stopping = true; await stopChild(); connection.end(JSON.stringify({ ok: true }) + "\n"); controlServer.close(); await unlink(socketPath).catch(() => {}); }
        else connection.end(JSON.stringify({ ok: false, error: "Unknown command" }) + "\n");
      } catch (error) { connection.end(JSON.stringify({ ok: false, error: error.message }) + "\n"); }
      finally { busy = false; }
    });
  });
  await new Promise((resolve, reject) => { controlServer.once("error", reject); controlServer.listen(socketPath, resolve); });
  await chmod(socketPath, 0o600);
  async function shutdown() { if (stopping) return; stopping = true; await stopChild(); controlServer.close(); await unlink(socketPath).catch(() => {}); }
  process.on("SIGINT", shutdown); process.on("SIGTERM", shutdown);
  try { await startChild(); } catch (error) { await shutdown(); throw error; }
}

try {
  const command = process.argv[2] || "start";
  if (command === "setup") { await run(path.join(root, "scripts/setup.mjs")); await dependencies(["install", "--frozen-lockfile"]); await run(prisma, ["db", "push"]); await run(next, ["build"]); }
  else if (command === "build") { await run(prisma, ["generate"]); await run(next, ["build"]); }
  else if (command === "install") await dependencies(["install", "--frozen-lockfile"]);
  else if (command === "update") await dependencies(["update"]);
  else if (command === "reset-login") await run(path.join(root, "scripts/reset-admin.mjs"));
  else if (command === "restart" || command === "stop" || command === "status") {
    const result = await control(command);
    if (result?.ok) console.log(command === "stop" ? "The Archive stopped." : "The Archive is ready: " + result.urls.join(" · "));
    else if (command === "restart") await supervise();
    else console.log(result?.error || "The Archive is not managed by this launcher yet.");
  } else if (command === "start") await supervise();
  else throw new Error("Use ./archive setup, start, restart, stop, status, build, install, update, or reset-login.");
} catch (error) { console.error(error.message); process.exitCode = 1; }
