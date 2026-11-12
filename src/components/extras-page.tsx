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
  description: string;
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
}

export function ExtrasPage() {
  const { slug } = useParams<{ slug: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const category = search.get("category") || "";
  const checkIn = search.get("check_in") || "";
  const checkOut = search.get("check_out") || "";
  const adults = Number(search.get("adults") || 1);
  const children = Number(search.get("children") || 0);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [offer, setOffer] = useState<Offer | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const guests = adults + children;
    const query = new URLSearchParams({ check_in: checkIn, check_out: checkOut, guests: String(guests) });
    Promise.all([
      api<{ data: { property: { currency: string; widget_settings?: { extras?: Extra[] } } } }>(`/api/public/properties/${slug}`),
      api<{ data: { categories: Offer[] } }>(`/api/public/properties/${slug}/availability?${query}`),
    ])
      .then(([propertyResult, stayResult]) => {
        const list = (propertyResult.data.property.widget_settings?.extras ?? []).filter((item) => item.is_active);
        setExtras(list);
        setCurrency(propertyResult.data.property.currency);
        setOffer(stayResult.data.categories.find((item) => item.id === category) ?? null);
        setPicked(Object.fromEntries(list.map((item) => [item.id, 0])));
      })
      .catch((loadError) => setError(errorMessage(loadError)))
      .finally(() => setLoading(false));
  }, [slug, category, checkIn, checkOut, adults, children]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-white">
        <Spinner label="Loading extras" />
      </div>
    );
  }

  const nights = offer?.nights || 1;
  const rooms = Math.max(1, Number(search.get("rooms") || 1));
  const extraTotal = extras.reduce((sum, item) => {
    const quantity = picked[item.id] || 0;
    const amount = item.charge === "per_stay" ? item.price * quantity : item.price * quantity * nights;
    return sum + amount;
  }, 0);
  const total = (offer?.total_price || 0) * rooms + extraTotal;

  function continueNext() {
    const selected = extras.filter((item) => (picked[item.id] || 0) > 0).map((item) => ({ id: item.id, quantity: picked[item.id] }));
    sessionStorage.setItem(`impact-stay:${slug}`, JSON.stringify({ extras: selected }));
    router.push(`/h/${slug}/checkout?${search.toString()}`);
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-6 pb-28">
        <BookingSteps current={3} />
        <Link href={`/h/${slug}`} className="mt-6 inline-block text-sm text-slate-500">← Back</Link>
        <h1 className="mt-3 text-2xl font-bold">Enhance Your Stay</h1>
        <p className="text-sm text-slate-500">Add extras to make your trip even more special</p>
        {error && <div className="mt-4"><Banner>{error}</Banner></div>}
        <div className="mt-5 grid gap-3">
          {extras.length === 0 && <p className="text-sm text-slate-500">This hotel has no extras. Continue to guest details.</p>}
          {extras.map((item) => {
            const quantity = picked[item.id] || 0;
            const selected = quantity > 0;
            return (
              <article key={item.id} className={`rounded-2xl border p-4 ${selected ? "border-orange-300 bg-orange-50/40" : "border-slate-200"}`}>
                <button type="button" className="flex w-full items-start justify-between gap-3 text-left" onClick={() => setPicked({ ...picked, [item.id]: selected ? 0 : 1 })}>
                  <span>
                    <span className="block font-semibold">{item.name}</span>
                    {item.description && <span className="mt-1 block text-sm text-slate-500">{item.description}</span>}
                    <span className="mt-2 block text-sm font-semibold">{money(item.price, currency)} {item.charge === "per_stay" ? "per stay" : "per night"}</span>
                  </span>
                  <span className={`grid h-6 w-6 place-items-center rounded-full text-xs text-white ${selected ? "bg-[#f08a2a]" : "bg-slate-200"}`}>{selected ? "✓" : ""}</span>
                </button>
                {selected && (
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span>Quantity</span>
                    <span className="flex items-center gap-3">
                      <button type="button" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200" onClick={() => setPicked({ ...picked, [item.id]: Math.max(0, quantity - 1) })}>−</button>
                      {quantity}
                      <button type="button" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200" onClick={() => setPicked({ ...picked, [item.id]: Math.min(10, quantity + 1) })}>+</button>
                    </span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xl font-bold">{money(total, offer?.currency || currency)}</p>
            <p className="text-xs text-slate-500">{rooms} room{rooms === 1 ? "" : "s"} · {nights} night{nights === 1 ? "" : "s"}</p>
          </div>
          <button type="button" className="rounded-xl bg-[#f08a2a] px-5 py-2.5 text-sm font-semibold text-white" onClick={continueNext}>Continue →</button>
        </div>
      </div>
    </main>
  );
}
