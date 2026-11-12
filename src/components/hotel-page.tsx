"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { api } from "@/lib/api";
import { addLocalDays, errorMessage, localIso, money } from "@/lib/format";
import { BookingSteps, portalButtonColor } from "./booking-steps";
import { RoomCategoryCard } from "./room-category-card";
import { Banner, Empty, Spinner } from "./ui";

interface PublicProperty {
  name: string;
  slug: string;
  description: string;
  city: string;
  country: string;
  phone: string | null;
  email: string | null;
  currency: string;
  check_in_time: string;
  check_out_time: string;
  policies: string;
  cover_image_url?: string | null;
  widget_settings: { primary_color?: string; button_label?: string; show_policies?: boolean };
  payments_enabled: boolean;
}

interface Offer {
  id: string;
  name: string;
  description: string;
  max_occupancy: number;
  amenities: string[];
  images?: string[];
  booking_policy: string;
  size_sqft?: number | null;
  beds?: string;
  original_price?: number | null;
  rate_plan?: string;
  rate_plan_note?: string;
  refundable?: boolean;
  available: boolean;
  reason: string;
  rooms_left: number;
  nights: number;
  total_price: number;
  average_nightly: number;
  currency: string;
}

export function HotelPage() {
  const params = useParams<{ slug: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const embed = search.get("embed") === "1";
  const tomorrow = localIso(new Date(Date.now() + 86400000));
  const [property, setProperty] = useState<PublicProperty | null>(null);
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promo, setPromo] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [roomCount, setRoomCount] = useState(1);
  const [form, setForm] = useState({
    check_in: search.get("check_in") || tomorrow,
    check_out: search.get("check_out") || addLocalDays(tomorrow, 1),
    adults: Number(search.get("adults") || 2),
    children: Number(search.get("children") || 0),
  });

  useEffect(() => {
    let active = true;
    api<{ data: { property: PublicProperty } }>(`/api/public/properties/${params.slug}`)
      .then((result) => {
        if (active) setProperty(result.data.property);
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
  }, [params.slug]);

  async function searchRooms(event?: FormEvent) {
    event?.preventDefault();
    setSearching(true);
    setError("");
    try {
      const guests = form.adults + form.children;
      const query = new URLSearchParams({
        check_in: form.check_in,
        check_out: form.check_out,
        guests: String(guests),
      });
      const result = await api<{ data: { categories: Offer[] } }>(`/api/public/properties/${params.slug}/availability?${query}`);
      setOffers(result.data.categories);
      setSelectedId(null);
      setRoomCount(1);
      window.scrollTo({ top: 0 });
    } catch (searchError) {
      setOffers(null);
      setError(errorMessage(searchError));
    } finally {
      setSearching(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner label="Loading hotel" />
      </div>
    );
  }

  if (!property) {
    return (
      <main className="mx-auto grid min-h-screen max-w-lg place-items-center p-6">
        <Banner>{error || "This hotel is not available."}</Banner>
      </main>
    );
  }

  const accent = portalButtonColor(property.widget_settings.primary_color);
  const showPolicies = property.widget_settings.show_policies !== false;
  const place = [property.city, property.country].filter(Boolean).join(", ");
  const guestLabel = `${form.adults} Adult${form.adults === 1 ? "" : "s"}${form.children ? `, ${form.children} Child${form.children === 1 ? "" : "ren"}` : ""}, 1 Room`;

  function applyStay(checkIn: string, nights: number) {
    setForm((current) => ({ ...current, check_in: checkIn, check_out: addLocalDays(checkIn, nights) }));
  }

  return (
    <div className={`min-h-screen bg-white text-slate-900 ${embed ? "py-2" : ""}`}>
      <main className="mx-auto max-w-5xl px-4 py-6 pb-16">
        <section className="relative overflow-hidden rounded-[28px] bg-slate-900">
          {property.cover_image_url ? (
            <img src={property.cover_image_url} alt="" className="aspect-[16/7] w-full object-cover" />
          ) : (
            <div className="aspect-[16/7] w-full bg-gradient-to-br from-amber-200 via-orange-300 to-orange-500" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/20" />
          <div className="absolute right-0 bottom-0 left-0 p-6 text-white md:p-8">
            <div className="flex gap-1 text-amber-300" aria-hidden="true">
              {Array.from({ length: 5 }, (_, index) => (
                <Star key={index} />
              ))}
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{property.name}</h1>
            <p className="mt-1 max-w-lg text-sm text-white/90">{property.description || place || "Your home away from home"}</p>
          </div>
        </section>

        <BookingSteps current={offers ? 2 : 1} />

        {!offers && (
          <>
        <div className="mt-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Plan Your Stay</h2>
          <p className="mt-2 text-sm text-slate-500">Select your dates and guests to check availability</p>
        </div>

        <form onSubmit={searchRooms} className="mx-auto mt-6 max-w-xl rounded-3xl border border-slate-200 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap justify-center gap-2">
            <QuickChip label="Tonight" onClick={() => applyStay(localIso(new Date()), 1)} />
            <QuickChip label="Tomorrow" onClick={() => applyStay(addLocalDays(localIso(new Date()), 1), 1)} />
            <QuickChip label="This Weekend" onClick={() => applyStay(weekendStart(0), 1)} />
            <QuickChip label="Next Weekend" onClick={() => applyStay(weekendStart(1), 1)} />
          </div>

          <label className="mt-5 block text-[11px] font-semibold tracking-[0.14em] text-slate-500">
            DATES
            <span className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
              <CalendarIcon />
              <input className="w-full bg-transparent text-sm text-slate-800 outline-none" type="date" required value={form.check_in} onChange={(event) => setForm({ ...form, check_in: event.target.value })} />
              <span className="text-slate-300">→</span>
              <input className="w-full bg-transparent text-sm text-slate-800 outline-none" type="date" required value={form.check_out} onChange={(event) => setForm({ ...form, check_out: event.target.value })} />
            </span>
          </label>

          <div className="relative mt-4">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-500">GUESTS & ROOMS</p>
            <button type="button" className="mt-2 flex w-full items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm" onClick={() => setGuestsOpen((open) => !open)}>
              <PeopleIcon />
              {guestLabel}
            </button>
            {guestsOpen && (
              <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-4">
                <Counter label="Adults" value={form.adults} min={1} max={20} onChange={(adults) => setForm({ ...form, adults })} />
                <Counter label="Children" value={form.children} min={0} max={10} onChange={(children) => setForm({ ...form, children })} />
              </div>
            )}
          </div>

          <button type="button" className="mt-4 text-sm font-medium text-[#f08a2a]" onClick={() => setPromoOpen((open) => !open)}>
            Have a promo code?
          </button>
          {promoOpen && (
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
              placeholder="Enter code"
              value={promo}
              onChange={(event) => setPromo(event.target.value)}
            />
          )}

          <button className="mt-4 w-full rounded-2xl px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-60" style={{ background: accent }} disabled={searching}>
            {searching ? "Searching…" : "Search Availability"}
          </button>
          {promo.trim() && <p className="mt-2 text-center text-xs text-slate-500">This hotel is not applying promo codes yet. Availability is shown at the regular rate.</p>}
        </form>
          </>
        )}

        {search.get("payment") === "cancelled" && !offers && (
          <div className="mx-auto mt-4 max-w-xl">
            <Banner tone="info">Payment was cancelled. You can search again and choose pay at the property.</Banner>
          </div>
        )}
        {error && (
          <div className="mx-auto mt-4 max-w-xl">
            <Banner>{error}</Banner>
          </div>
        )}

        {offers && (
          <div className="mt-8 grid gap-4">
            <div>
              <button type="button" className="text-sm text-slate-500" onClick={() => { setOffers(null); setSelectedId(null); }}>← Back</button>
              <h2 className="mt-3 text-2xl font-bold">Select Your Room</h2>
              <p className="text-sm text-slate-500">
                {offers[0] ? `${offers[0].nights} night${offers[0].nights === 1 ? "" : "s"}` : "Stay"} · {form.adults} adult{form.adults === 1 ? "" : "s"}
              </p>
            </div>
            {offers.length === 0 && <Empty title="No rooms for that party" body="Try fewer guests, or ask the hotel to open another category." />}
            {offers.map((offer) => {
              const save = offer.original_price && offer.original_price > offer.average_nightly ? Math.round((1 - offer.average_nightly / offer.original_price) * 100) : 0;
              const selected = selectedId === offer.id;
              const maxRooms = Math.max(1, offer.rooms_left || 1);
              return (
                <RoomCategoryCard
                  key={offer.id}
                  name={offer.name}
                  description={offer.description}
                  images={offer.images}
                  sizeSqft={offer.size_sqft}
                  beds={offer.beds}
                  maxGuests={offer.max_occupancy}
                  amenities={offer.amenities}
                  ratePlan={offer.rate_plan}
                  ratePlanNote={offer.rate_plan_note}
                  originalPrice={offer.original_price}
                  price={offer.average_nightly}
                  currency={offer.currency}
                  nights={offer.nights}
                  refundable={offer.refundable}
                  savePercent={save}
                  badge={offer.available && offer.rooms_left > 0 && offer.rooms_left <= 5 ? `Only ${offer.rooms_left} left!` : undefined}
                  caption={`${money(offer.total_price * (selected ? roomCount : 1), offer.currency)} total`}
                  unavailable={offer.available ? undefined : offer.reason}
                  action={
                    selected ? (
                      <div className="flex w-full items-center justify-end gap-2">
                        <button type="button" aria-label="Fewer rooms" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-700 disabled:text-slate-300" disabled={roomCount <= 1} onClick={() => setRoomCount((count) => Math.max(1, count - 1))}>−</button>
                        <span className="w-4 text-center text-sm font-semibold">{roomCount}</span>
                        <button type="button" aria-label="More rooms" className="grid h-9 w-9 place-items-center rounded-lg bg-[#f08a2a] text-lg font-semibold text-white disabled:opacity-50" disabled={roomCount >= maxRooms} onClick={() => setRoomCount((count) => Math.min(maxRooms, count + 1))}>+</button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="rounded-xl bg-[#f08a2a] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                        disabled={!offer.available}
                        onClick={() => {
                          setSelectedId(offer.id);
                          setRoomCount(1);
                        }}
                      >
                        Select Room
                      </button>
                    )
                  }
                />
              );
            })}
          </div>
        )}

        {offers && selectedId && (
          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
              <div>
                <p className="text-xl font-bold">{money((offers.find((item) => item.id === selectedId)?.total_price || 0) * roomCount, offers.find((item) => item.id === selectedId)?.currency)}</p>
                <p className="text-xs text-slate-500">{roomCount} room{roomCount === 1 ? "" : "s"} · {offers[0]?.nights || 1} night{(offers[0]?.nights || 1) === 1 ? "" : "s"}</p>
              </div>
              <button
                type="button"
                className="rounded-xl bg-[#f08a2a] px-5 py-2.5 text-sm font-semibold text-white"
                onClick={() => {
                  const query = new URLSearchParams({
                    category: selectedId,
                    check_in: form.check_in,
                    check_out: form.check_out,
                    adults: String(form.adults),
                    children: String(form.children),
                    rooms: String(roomCount),
                  });
                  router.push(`/h/${params.slug}/extras?${query}`);
                }}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {!offers && (
          <section className="mx-auto mt-5 max-w-xl rounded-3xl border border-slate-200 p-5">
            <Policy icon={<ClockIcon />} title="Check-in / Check-out" body={`Check-in: ${clock(property.check_in_time)} · Check-out: ${clock(property.check_out_time)}`} />
            {showPolicies && property.policies && <Policy icon={<ShieldIcon />} title="Cancellation Policy" body={property.policies} />}
            <Policy
              icon={<CardIcon />}
              title="Payment Terms"
              body={property.payments_enabled ? "Pay online now, or pay the full amount at the property." : "Full payment is collected at the property."}
            />
          </section>
        )}
      </main>
    </div>
  );
}

function weekendStart(skip: number) {
  const today = new Date();
  const day = today.getDay();
  const daysUntilSaturday = (6 - day + 7) % 7;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysUntilSaturday + skip * 7);
  return localIso(start);
}

function clock(value: string) {
  const [hourText, minuteText] = value.slice(0, 5).split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function QuickChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:border-slate-300" onClick={onClick}>
      {label}
    </button>
  );
}

function Counter({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span>{label}</span>
      <span className="flex items-center gap-3">
        <button type="button" className="grid h-8 w-8 place-items-center rounded-full border border-slate-200" onClick={() => onChange(Math.max(min, value - 1))} aria-label={`Fewer ${label}`}>
          −
        </button>
        {value}
        <button type="button" className="grid h-8 w-8 place-items-center rounded-full border border-slate-200" onClick={() => onChange(Math.min(max, value + 1))} aria-label={`More ${label}`}>
          +
        </button>
      </span>
    </div>
  );
}

function Policy({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-3 border-t border-slate-100 py-3 first:border-0 first:pt-0">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-500">{body}</p>
      </div>
    </div>
  );
}

function Star() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 1.5 12.6 7l6 .6-4.5 4 1.3 5.9L10 14.8 4.6 17.5 5.9 11.6 1.4 7.6 7.4 7 10 1.5Z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-slate-400" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-slate-400" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M16 19a4.5 4.5 0 0 1 4.5-4" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3 5 6v6c0 4.5 3 7 7 9 4-2 7-4.5 7-9V6l-7-3Z" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}
