"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminAccount({ username }: { username: string }) {
  const [name, setName] = useState(username);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const router = useRouter();
  async function save(event: React.FormEvent) {
    event.preventDefault(); setStatus("");
    if (newPassword !== confirm) { setStatus("The new passwords do not match."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: name, currentPassword, newPassword }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to change login");
      setCurrentPassword(""); setNewPassword(""); setConfirm("");
      setStatus("Login saved. Other admin sessions have been signed out. You are still signed in."); router.refresh();
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to change login"); }
    finally { setBusy(false); }
  }
  const input = "mt-2 block w-full rounded-xl border border-white/15 studio-input px-4 py-3 text-white outline-none focus:border-[#d4af37]";
  return <section className="rounded-2xl border border-white/10 bg-white/[.03] p-6"><h2 className="font-editorial text-3xl">Administrator login</h2><p className="mt-3 text-sm leading-relaxed text-white/55">Change your username or password here. Enter your current password to save. Leave the new password blank to keep it.</p><form onSubmit={save} className="mt-6 max-w-xl space-y-5"><label className="block text-sm text-white/70">Username<input required autoComplete="username" minLength={3} maxLength={64} value={name} onChange={e => setName(e.target.value)} className={input} /></label><label className="block text-sm text-white/70">Current password<input required autoComplete="current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={input} /></label><label className="block text-sm text-white/70">New password<input autoComplete="new-password" type="password" minLength={8} maxLength={128} value={newPassword} onChange={e => setNewPassword(e.target.value)} className={input} /></label><label className="block text-sm text-white/70">Confirm new password<input autoComplete="new-password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className={input} /></label><button disabled={busy} className="min-h-11 rounded-full bg-studio-fill px-5 text-sm font-semibold text-black disabled:opacity-50">{busy ? "Saving…" : "Save login"}</button><p role="status" className="text-sm text-studio-soft">{status}</p></form></section>;
}
