import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const file = new URL("../.env.local", import.meta.url);
let content = await readFile(file, "utf8");
if (!/^SESSION_SECRET=/m.test(content) || content.includes("archive-local-session-change-this-before-public-exposure")) {
  const setting = 'SESSION_SECRET="' + randomBytes(48).toString("hex") + '"';
  content = /^SESSION_SECRET=.*$/m.test(content) ? content.replace(/^SESSION_SECRET=.*$/m, setting) : content + "\n" + setting + "\n";
}
if (!/^SESSION_COOKIE_SECURE=/m.test(content)) content += '\nSESSION_COOKIE_SECURE="false"\n';
await writeFile(file, content, { mode: 0o600 });
console.log("Local environment configured.");
