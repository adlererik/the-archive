// Erik Adler: installations must supply their own signing key.
export function sessionSecret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32 || value === "replace-with-a-long-random-secret" || value === "archive-local-session-change-this-before-public-exposure") throw new Error("Configure a unique SESSION_SECRET of at least 32 characters in .env.local. Run ./archive setup for a new installation.");
  return value;
}
