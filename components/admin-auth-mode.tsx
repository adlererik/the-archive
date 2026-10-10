"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, KeyRound } from "lucide-react";
import type { AdminAuthMode as LoginMode, AdminAuthSettings } from "@/lib/admin-auth-settings";

export function AdminAuthMode({ settings }: { settings: AdminAuthSettings }) {
  const [saved, setSaved] = useState(settings.mode);
  const [mode, setMode] = useState<LoginMode>(settings.mode);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const router = useRouter();
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setStatus("");
    try {
      const response = await fetch("/api/admin/auth-mode", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, currentPassword: password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save login method");
      setSaved(data.mode); setPassword(""); setStatus("Login method saved. Other admin sessions have been signed out."); router.refresh();
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to save login method"); }
    finally { setBusy(false); }
  }
  return <section className="mb-6 rounded-2xl border border-white/10 bg-white/[.03] p-6"><h2 className="font-editorial text-3xl">How you sign in</h2><p className="mt-3 text-sm leading-relaxed text-white/55">Choose the login method for this installation.</p><form onSubmit={save} className="mt-6 max-w-2xl space-y-4"><fieldset className="grid gap-3 sm:grid-cols-2"><legend className="sr-only">Administrator login method</legend>{([{ value: "password", title: "Username & password", description: "Standard CMS login. Works without Cloudflare.", icon: KeyRound }, { value: "cloudflare", title: "Cloudflare sign-in", description: "Use your configured Google or Apple sign-in and device verification. Skip the CMS password screen.", icon: Fingerprint }] as const).map(option => <label key={option.value} className={"flex cursor-pointer gap-3 rounded-2xl border p-4 " + (mode === option.value ? "border-studio-accent bg-studio-fill/10" : "border-white/15") }><input type="radio" name="login-mode" value={option.value} checked={mode === option.value} disabled={option.value === "cloudflare" && !settings.cloudflareConfigured} onChange={() => { setMode(option.value); setStatus(""); }} className="mt-1 accent-studio-accent" /><div><option.icon className="mb-3 h-5 w-5 text-studio-accent" /><p className="text-sm font-semibold">{option.title}</p><p className="mt-2 text-xs leading-relaxed text-white/55">{option.description}</p></div></label>)}</fieldset>{!settings.cloudflareConfigured ? <p className="text-sm text-white/55">Set up Cloudflare Access and its owner account on your server to enable Cloudflare sign-in. See the administration guide in Info & documentation.</p> : <p className="text-xs leading-relaxed text-white/55">Google and Apple may ask you to choose an account or confirm your identity. Fingerprint, Face ID and phone-assisted QR sign-in depend on your browser and enrolled devices. Apple sign-in uses a Cloudflare account with the approved email.</p>}{mode === "password" && mode !== saved ? <label className="block text-sm text-white/70">Confirm your CMS password<input required type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} className="mt-2 block w-full rounded-xl border border-white/15 studio-input px-4 py-3 text-white" /></label> : null}<button disabled={busy || mode === saved || (mode === "cloudflare" && !settings.cloudflareConfigured)} className="min-h-11 rounded-full bg-studio-fill px-5 text-sm font-semibold text-black disabled:opacity-50">{busy ? "Saving…" : "Save login method"}</button><p role="status" className="text-sm text-studio-soft">{status}</p></form></section>;
}
