"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { errorMessage, money } from "@/lib/format";
import { BookingSteps } from "./booking-steps";
import { Banner, Spinner } from "./ui";

interface Extra {
  id: string;
  name: string;
  price: number;
  charge: "per_night" | "per_stay";
  is_active: boolean;
}

interface Offer {
  id: string;
  name: string;
  nights: number;
  total_price: number;
  currency: string;
  available: boolean;
  reason: string;
}

interface Guest {
  first_name: string;
  last_name: string;
  guest_email: string;
  guest_phone: string;
  special_requests: string;
}

export function ReviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const category = search.get("category") || "";
  const checkIn = search.get("check_in") || "";
  const checkOut = search.get("check_out") || "";
  const adults = Number(search.get("adults") || 1);
  const children = Number(search.get("children") || 0);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [picked, setPicked] = useState<Array<{ id: string; quantity: number }>>([]);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [payNow, setPayNow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(`impact-stay:${slug}`);
    const draft = stored ? JSON.parse(stored) : {};
    setGuest(draft.guest ?? null);
    setPicked(draft.extras ?? []);
    const guests = adults + children;
    const query = new URLSearchParams({ check_in: checkIn, check_out: checkOut, guests: String(guests) });
    Promise.all([
      api<{ data: { property: { payments_enabled: boolean; widget_settings?: { extras?: Extra[] } } } }>(`/api/public/properties/${slug}`),
      api<{ data: { categories: Offer[] } }>(`/api/public/properties/${slug}/availability?${query}`),
    ])
      .then(([propertyResult, stayResult]) => {
        setPaymentsEnabled(propertyResult.data.property.payments_enabled);
        setExtras(propertyResult.data.property.widget_settings?.extras ?? []);
        setOffer(stayResult.data.categories.find((item) => item.id === category) ?? null);
      })
      .catch((loadError) => setError(errorMessage(loadError)))
      .finally(() => setLoading(false));
  }, [slug, category, checkIn, checkOut, adults, children]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-white">
        <Spinner label="Preparing review" />
      </div>
    );
  }

  const nights = offer?.nights || 1;
  const rooms = Math.max(1, Number(search.get("rooms") || 1));
  const chosen = picked
    .map((pick) => {
      const extra = extras.find((item) => item.id === pick.id);
      if (!extra) return null;
      const amount = extra.charge === "per_stay" ? extra.price * pick.quantity : extra.price * pick.quantity * nights;
      return { ...extra, quantity: pick.quantity, amount };
    })
    .filter((item): item is Extra & { quantity: number; amount: number } => Boolean(item));
  const roomTotal = (offer?.total_price || 0) * rooms;
  const total = roomTotal + chosen.reduce((sum, item) => sum + item.amount, 0);

  async function pay() {
    if (!guest) {
      setError("Add the guest details before paying.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const result = await api<{ data: { access_token: string; checkout_url: string | null; reservation: { confirmation_code: string } } }>(
        `/api/public/properties/${slug}/reservations`,
        {
          method: "POST",
          body: {
            category_id: category,
            check_in: checkIn,
            check_out: checkOut,
            adults,
            children,
            pay_now: payNow,
            guest_name: `${guest.first_name} ${guest.last_name}`.trim(),
            guest_email: guest.guest_email,
            guest_phone: guest.guest_phone,
            special_requests: guest.special_requests,
            extras: picked,
            rooms,
          },
        },
      );
      if (result.data.checkout_url) {
        window.location.href = result.data.checkout_url;
        return;
      }
      const query = new URLSearchParams({ code: result.data.reservation.confirmation_code, token: result.data.access_token });
      router.push(`/h/${slug}/confirmation?${query}`);
    } catch (payError) {
      setError(errorMessage(payError));
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-white pb-28 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <BookingSteps current={4} />
        <Link href={`/h/${slug}/checkout?${search.toString()}`} className="mt-6 inline-block text-sm text-slate-500">← Back</Link>
        <h1 className="mt-3 text-2xl font-bold">Review booking</h1>
        <p className="text-sm text-slate-500">Check the stay, then pay.</p>
        {error && <div className="mt-4"><Banner>{error}</Banner></div>}
        {!guest && <p className="mt-4 text-sm text-red-800">Guest details are missing. Go back and enter them.</p>}
        <section className="mt-5 rounded-3xl border border-slate-200 p-5">
          <h2 className="font-semibold">{offer?.name || "Room"}</h2>
          <p className="mt-2 text-sm text-slate-600">{checkIn} to {checkOut} · {adults} adults{children ? `, ${children} children` : ""}</p>
          <p className="mt-3 text-sm">{rooms} room{rooms === 1 ? "" : "s"} · {money(roomTotal, offer?.currency)}</p>
          {chosen.map((item) => (
            <p key={item.id} className="text-sm">{item.name} × {item.quantity} · {money(item.amount, offer?.currency)}</p>
          ))}
          {guest && (
            <div className="mt-4 border-t border-slate-100 pt-4 text-sm">
              <p className="font-medium">{guest.first_name} {guest.last_name}</p>
              <p className="text-slate-500">{guest.guest_email}{guest.guest_phone ? ` · ${guest.guest_phone}` : ""}</p>
              {guest.special_requests && <p className="mt-2 text-slate-500">{guest.special_requests}</p>}
            </div>
          )}
          {offer && !offer.available && <p className="mt-3 text-sm text-red-800">{offer.reason}</p>}
        </section>
        <fieldset className="mt-4 grid gap-2 text-sm">
          <legend className="font-medium">Payment</legend>
          <label className="flex gap-2"><input type="radio" checked={!payNow} onChange={() => setPayNow(false)} /> Pay at the property</label>
          <label className="flex gap-2"><input type="radio" checked={payNow} disabled={!paymentsEnabled} onChange={() => setPayNow(true)} /> Pay online now {paymentsEnabled ? "" : "(not enabled)"}</label>
        </fieldset>
      </div>
      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xl font-bold">{money(total, offer?.currency)}</p>
            <p className="text-xs text-slate-500">{rooms} room{rooms === 1 ? "" : "s"} · {nights} night{nights === 1 ? "" : "s"}</p>
          </div>
          <button type="button" className="rounded-xl bg-[#f08a2a] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60" disabled={pending || !guest || !offer?.available} onClick={pay}>
            {pending ? "Processing…" : payNow ? "Pay now →" : "Confirm & pay at hotel →"}
          </button>
        </div>
      </div>
    </main>
  );
}
