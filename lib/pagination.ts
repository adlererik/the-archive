export function encodeCursor(post: { id: string; takenAt: Date }) {
  return Buffer.from(JSON.stringify({ id: post.id, takenAt: post.takenAt.toISOString() })).toString("base64url");
}

export function decodeCursor(value: string) {
  try {
    if (value.length > 1000) return null;
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (typeof parsed.id !== "string" || typeof parsed.takenAt !== "string") return null;
    const takenAt = new Date(parsed.takenAt);
    return Number.isNaN(takenAt.valueOf()) ? null : { id: parsed.id, takenAt };
  } catch { return null; }
}
