"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthFrame } from "@/components/auth-frame";
import { IconLock, IconMail } from "@/components/desk-icons";
import { Banner, Button } from "@/components/ui";
import { errorMessage } from "@/lib/format";
import { createClient, supabaseConfigured } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
      if (signError) throw signError;
      router.push("/admin");
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthFrame kicker="Hotelier sign in" title="Run today's hotel from one desk." subtitle="Rooms, rates, availability, and reservations stay in a single view.">
      <form onSubmit={onSubmit} className="rounded-3xl border border-line bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Sign in to your hotel desk</p>
        <div className="mt-6 grid gap-4">
          {!supabaseConfigured() && <Banner>Supabase is not configured in this app yet.</Banner>}
          {error && <Banner>{error}</Banner>}
          <label className="block text-sm">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Email</span>
            <span className="flex items-center gap-2 rounded-xl border border-line bg-[#f8fafc] px-3 focus-within:border-clay focus-within:ring-4 focus-within:ring-clay/15">
              <IconMail className="text-muted" />
              <input className="w-full bg-transparent py-2.5 text-sm outline-none" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </span>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Password</span>
            <span className="flex items-center gap-2 rounded-xl border border-line bg-[#f8fafc] px-3 focus-within:border-clay focus-within:ring-4 focus-within:ring-clay/15">
              <IconLock className="text-muted" />
              <input className="w-full bg-transparent py-2.5 text-sm outline-none" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            </span>
          </label>
          <Button className="w-full" disabled={pending || !supabaseConfigured()}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
          <div className="flex justify-between text-sm">
            <Link href="/admin/forgot-password" className="font-medium text-clay">
              Forgot password
            </Link>
            <Link href="/signup" className="text-muted">
              Create a hotel
            </Link>
          </div>
        </div>
      </form>
    </AuthFrame>
  );
}
