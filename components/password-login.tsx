"use client";

import { KeyRound, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PasswordLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Login failed"); }
      router.push("/admin"); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to connect to the archive"); }
    finally { setBusy(false); }
  }

  return <main className="page-glow grid min-h-screen place-items-center p-5"><form onSubmit={submit} className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-white/[.035] p-7 shadow-2xl backdrop-blur-xl sm:p-10"><div className="grid h-14 w-14 place-items-center rounded-full bg-studio-fill/15 text-studio-highlight"><KeyRound className="h-6 w-6" /></div><p className="mt-7 text-xs font-semibold uppercase tracking-[.24em] text-studio-accent">Private management</p><h1 className="mt-2 font-editorial text-4xl">The Archive</h1><p className="mt-3 text-sm leading-relaxed text-white/55">Sign in with your administrator username and password.</p><label className="mt-8 block text-sm text-white/70">Username<input autoFocus required name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className="mt-2 block w-full rounded-xl border border-white/15 studio-input px-4 py-3 text-white outline-none focus:border-[#d4af37]" /></label><label className="mt-5 block text-sm text-white/70">Password<input required name="password" autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 block w-full rounded-xl border border-white/15 studio-input px-4 py-3 text-white outline-none focus:border-[#d4af37]" /></label>{error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}<button disabled={busy} className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-studio-fill px-5 py-3 text-sm font-bold text-black hover:bg-studio-hover disabled:opacity-50">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Enter archive"}</button></form></main>;
}
