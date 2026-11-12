"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthFrame } from "@/components/auth-frame";
import { Banner, Button, Field } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/format";
import { createClient, supabaseConfigured } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    property_name: "",
    city: "",
    country: "",
    phone: "",
    currency: "USD",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  });

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    try {
      const supabase = createClient();
      const { data, error: signError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.full_name },
          emailRedirectTo: `${window.location.origin}/admin`,
        },
      });
      if (signError) throw signError;
      if (!data.session) {
        setMessage("Check your email to confirm the account, then sign in. Your hotel is created on the first visit to the desk.");
        return;
      }
      await api("/api/auth/provision", {
        method: "POST",
        token: data.session.access_token,
        body: form,
      });
      router.push("/admin");
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthFrame kicker="New hotel account" title="Open a desk for your hotel." subtitle="A Starter trial includes one property for 14 days.">
      <form onSubmit={onSubmit} className="w-full rounded-3xl border border-line bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
        <p className="mt-2 text-sm text-muted">Your hotel is created after you sign in.</p>
        <div className="mt-6 grid gap-4">
          {!supabaseConfigured() && <Banner>Add the Supabase anon key before creating accounts.</Banner>}
          {error && <Banner>{error}</Banner>}
          {message && <Banner tone="ok">{message}</Banner>}
          <Field label="Your name" required value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} />
          <Field label="Email" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <Field label="Password" type="password" required minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          <Field label="Property name" required value={form.property_name} onChange={(event) => setForm({ ...form, property_name: event.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
            <Field label="Country" value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} />
          </div>
          <Button className="w-full" disabled={pending || !supabaseConfigured()}>{pending ? "Creating…" : "Create account"}</Button>
          <Link href="/admin/login" className="text-center text-sm font-medium text-clay">
            I already have an account
          </Link>
        </div>
      </form>
    </AuthFrame>
  );
}
