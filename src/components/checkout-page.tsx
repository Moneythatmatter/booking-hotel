"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/format";
import { BookingSteps } from "./booking-steps";
import { Banner, Field, Spinner, TextArea } from "./ui";

interface Offer {
  id: string;
  name: string;
  booking_policy: string;
  available: boolean;
  reason: string;
  total_price: number;
  nights: number;
  currency: string;
}

export function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const category = search.get("category") || "";
  const checkIn = search.get("check_in") || "";
  const checkOut = search.get("check_out") || "";
  const adults = Number(search.get("adults") || 1);
  const children = Number(search.get("children") || 0);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState({ first_name: "", last_name: "", guest_email: "", guest_phone: "", special_requests: "" });

  useEffect(() => {
    let active = true;
    const guests = adults + children;
    const query = new URLSearchParams({ check_in: checkIn, check_out: checkOut, guests: String(guests) });
    api<{ data: { property: { name: string; payments_enabled: boolean }; categories: Offer[] } }>(
      `/api/public/properties/${slug}/availability?${query}`,
    )
      .then((result) => {
        if (!active) return;
        setOffer(result.data.categories.find((item) => item.id === category) ?? null);
      })
      .catch((loadError) => {
        if (active) setError(errorMessage(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug, category, checkIn, checkOut, adults, children]);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const stored = sessionStorage.getItem(`impact-stay:${slug}`);
    const draft = stored ? JSON.parse(stored) : {};
    sessionStorage.setItem(`impact-stay:${slug}`, JSON.stringify({ ...draft, guest }));
    router.push(`/h/${slug}/review?${search.toString()}`);
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner label="Preparing checkout" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-6">
      <BookingSteps current={4} />
      <form onSubmit={onSubmit} className="mx-auto mt-6 max-w-xl rounded-3xl border border-slate-200 p-6">
        <Link href={`/h/${slug}/extras?${search.toString()}`} className="inline-block text-sm text-slate-500">
          ← Back
        </Link>
        <h1 className="mt-3 text-2xl font-bold">Guest Details</h1>
        <p className="text-sm text-slate-500">Tell us who&apos;s checking in</p>
        <div className="mt-6 grid gap-4">
          {error && <Banner>{error}</Banner>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First Name" required value={guest.first_name} onChange={(event) => setGuest({ ...guest, first_name: event.target.value })} />
            <Field label="Last Name" required value={guest.last_name} onChange={(event) => setGuest({ ...guest, last_name: event.target.value })} />
          </div>
          <Field label="Email" type="email" required value={guest.guest_email} onChange={(event) => setGuest({ ...guest, guest_email: event.target.value })} />
          <Field label="Phone" value={guest.guest_phone} onChange={(event) => setGuest({ ...guest, guest_phone: event.target.value })} />
          <TextArea label="Special Requests (optional)" placeholder="Early check-in, extra pillows, dietary requirements..." value={guest.special_requests} onChange={(event) => setGuest({ ...guest, special_requests: event.target.value })} />
          <button className="w-full rounded-2xl bg-[#f08a2a] px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-60" disabled={!offer?.available}>
            Review Booking →
          </button>
        </div>
      </form>
      </div>
    </main>
  );
}
