"use client";

import { useState, type ReactNode } from "react";
import { money } from "@/lib/format";

export function RoomCategoryCard({
  name,
  description,
  images,
  sizeSqft,
  beds,
  maxGuests,
  amenities,
  ratePlan,
  ratePlanNote,
  originalPrice,
  price,
  currency,
  nights,
  refundable,
  savePercent,
  badge,
  badgeTone = "alert",
  caption,
  unavailable,
  action,
  onEdit,
}: {
  name: string;
  description?: string;
  images?: string[];
  sizeSqft?: number | null;
  beds?: string;
  maxGuests: number;
  amenities?: string[];
  ratePlan?: string;
  ratePlanNote?: string;
  originalPrice?: number | null;
  price: number;
  currency: string;
  nights?: number;
  refundable?: boolean;
  savePercent?: number;
  badge?: string;
  badgeTone?: "alert" | "plain";
  caption?: string;
  unavailable?: string;
  action?: ReactNode;
  onEdit?: () => void;
}) {
  const photos = (images ?? []).filter(Boolean);
  const [photoIndex, setPhotoIndex] = useState(0);
  const photo = photos[photoIndex] || photos[0];
  const showOriginal = originalPrice != null && originalPrice > price;

  return (
    <article className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {onEdit && (
        <button type="button" aria-label={`Edit ${name}`} className="absolute top-5 right-5 z-10 grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" onClick={onEdit}>
          <PencilIcon />
        </button>
      )}
      <div className="grid md:grid-cols-[300px_1fr]">
        <div className="relative min-h-56 bg-slate-100">
          {photo ? <img src={photo} alt="" className="h-full min-h-56 w-full object-cover" /> : <div className="grid h-full min-h-56 place-items-center text-sm text-slate-400">Room photo</div>}
          {badge && <span className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white ${badgeTone === "plain" ? "bg-slate-900/75" : "bg-red-500"}`}>{badge}</span>}
          {savePercent && savePercent > 0 ? <span className="absolute top-3 right-3 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white">Save {savePercent}%</span> : null}
          {photos.length > 1 && (
            <>
              <button type="button" aria-label="Previous photo" className="absolute top-1/2 left-2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-700 shadow" onClick={() => setPhotoIndex((index) => (index - 1 + photos.length) % photos.length)}>‹</button>
              <button type="button" aria-label="Next photo" className="absolute top-1/2 right-2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-700 shadow" onClick={() => setPhotoIndex((index) => (index + 1) % photos.length)}>›</button>
            </>
          )}
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-[1fr_11rem]">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{name}</h3>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
              {sizeSqft ? <Meta icon="size">{sizeSqft} sqft</Meta> : null}
              <Meta icon="bed">{beds || "Bed"}</Meta>
              <Meta icon="guest">Up to {maxGuests} guests</Meta>
            </div>
            {amenities && amenities.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-600">
                {amenities.map((item) => (
                  <span key={item} className="inline-flex items-center gap-1">
                    <AmenityIcon name={item} />
                    {item}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-4 text-[11px] font-semibold tracking-[0.14em] text-slate-400">RATE PLAN</p>
            <div className="mt-1 flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
              <span className="font-medium text-slate-800">
                {ratePlan || "Room only"}
                {showOriginal && <span className="ml-2 text-slate-400 line-through">{money(originalPrice, currency)}</span>}
                <span className="ml-2">{money(price, currency)}</span>
              </span>
            </div>
            {ratePlanNote && <p className="mt-1 text-xs text-slate-500">{ratePlanNote}</p>}
            <span className="mt-3 inline-flex rounded-full border border-orange-200 px-2.5 py-0.5 text-[11px] font-medium text-orange-700">
              {refundable ? "Refundable" : "Non-refundable"}
            </span>
            {unavailable && <p className="mt-2 text-sm text-red-800">{unavailable}</p>}
          </div>
          <div className={`flex h-full w-full flex-col items-end gap-4 ${onEdit ? "pt-12" : "justify-between"}`}>
            <div className="w-full text-right">
              {nights ? <p className="text-xs text-slate-400">{nights} night{nights === 1 ? "" : "s"}</p> : <p className="text-xs text-slate-400">per night</p>}
              {showOriginal && <p className="text-sm text-slate-400 line-through">{money(originalPrice, currency)}</p>}
              <p className="text-2xl font-bold text-slate-900">{money(price, currency)}</p>
              {caption && <p className="text-xs text-slate-400">{caption}</p>}
            </div>
            {action && <div className="w-full">{action}</div>}
          </div>
        </div>
      </div>
    </article>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20h4l10-10-4-4L4 16v4z" />
      <path d="M13 7l4 4" />
    </svg>
  );
}

function Meta({ icon, children }: { icon: "size" | "bed" | "guest"; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon === "size" && <IconSize />}
      {icon === "bed" && <IconBed />}
      {icon === "guest" && <IconGuest />}
      {children}
    </span>
  );
}

function AmenityIcon({ name }: { name: string }) {
  const key = name.toLowerCase();
  if (key.includes("wi-fi") || key.includes("wifi") || key.includes("wi fi")) return <IconWifi />;
  if (key.includes("tv")) return <IconTv />;
  if (key.includes("water")) return <IconDrop />;
  if (key.includes("geyser") || key.includes("heater")) return <IconFlame />;
  if (key.includes("kit") || key.includes("breakfast") || key.includes("coffee")) return <IconCup />;
  return <IconSpark />;
}

function IconSize() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" />
    </svg>
  );
}

function IconBed() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 18V8M3 14h18v4M7 14v-3h6v3M21 18V11a2 2 0 0 0-2-2H10" />
    </svg>
  );
}

function IconGuest() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3" />
      <path d="M5 19c1.5-3 3.8-4.5 7-4.5S17.5 16 19 19" />
    </svg>
  );
}

function IconWifi() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 10a10 10 0 0 1 14 0M8 13a6 6 0 0 1 8 0" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

function IconTv() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M8 20h8" />
    </svg>
  );
}

function IconDrop() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />
    </svg>
  );
}

function IconFlame() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 3 3 0-3 0-6 0-8z" />
    </svg>
  );
}

function IconCup() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 8h10v6a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V8zM16 9h2a2 2 0 0 1 0 4h-2" />
    </svg>
  );
}

function IconSpark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
    </svg>
  );
}
