"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthFrame } from "@/components/auth-frame";
import { Banner, Button, Field } from "@/components/ui";
import { errorMessage } from "@/lib/format";
import { createClient } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });
      if (resetError) throw resetError;
      setMessage("If that email belongs to an account, a reset link is on its way.");
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthFrame kicker="Hotelier sign in" title="Reset your desk password." subtitle="We will email a link if the address belongs to a hotel account.">
      <form onSubmit={onSubmit} className="grid gap-4 rounded-3xl border border-line bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
        {error && <Banner>{error}</Banner>}
        {message && <Banner tone="ok">{message}</Banner>}
        <Field label="Email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <Button className="w-full" disabled={pending}>
          {pending ? "Sending…" : "Send reset link"}
        </Button>
        <Link href="/admin/login" className="text-center text-sm font-medium text-clay">
          Back to sign in
        </Link>
      </form>
    </AuthFrame>
  );
}
