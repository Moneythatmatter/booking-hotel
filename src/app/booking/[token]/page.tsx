"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Banner, Badge, Spinner, statusTone } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage, money } from "@/lib/format";

interface BookingView {
  confirmation_code: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  status: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  special_requests: string;
  property: { name: string; city: string; country: string; phone: string | null; check_in_time: string; check_out_time: string; policies: string };
  category: { name: string; booking_policy: string };
  room: { room_number: string } | null;
}

export default function GuestBookingPage() {
  const { token } = useParams<{ token: string }>();
  const [booking, setBooking] = useState<BookingView | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ data: BookingView }>(`/api/public/bookings/${token}`)
      .then((result) => setBooking(result.data))
      .catch((loadError) => setError(errorMessage(loadError)));
  }, [token]);

  if (error) {
    return (
      <main className="mx-auto grid min-h-screen max-w-lg place-items-center p-6">
        <Banner>{error}</Banner>
      </main>
    );
  }
  if (!booking) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner label="Opening your booking" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-sm uppercase tracking-[0.16em] text-muted">Private booking link</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-5xl">{booking.property.name}</h1>
        <Badge tone={statusTone(booking.status)}>{booking.status.replaceAll("_", " ")}</Badge>
      </div>
      <p className="mt-3 text-muted">
        {[booking.property.city, booking.property.country].filter(Boolean).join(", ")}
      </p>
      <section className="mt-8 grid gap-4 rounded-3xl border border-line bg-card p-6 sm:grid-cols-2">
        <Info label="Confirmation" value={booking.confirmation_code} />
        <Info label="Guest" value={`${booking.guest_name} · ${booking.guest_email}`} />
        <Info label="Stay" value={`${booking.check_in} to ${booking.check_out}`} />
        <Info label="Guests" value={`${booking.adults} adults, ${booking.children} children`} />
        <Info label="Room" value={booking.category.name} />
        <Info label="Assigned room" value={booking.room?.room_number || "Assigned at the hotel"} />
        <Info label="Total" value={money(booking.total_amount, booking.currency)} />
        <Info label="Payment" value={booking.payment_status} />
      </section>
      <section className="mt-4 rounded-3xl border border-line bg-card p-6 text-sm text-muted">
        <p>
          Check-in {booking.property.check_in_time} · Check-out {booking.property.check_out_time}
          {booking.property.phone ? ` · ${booking.property.phone}` : ""}
        </p>
        {booking.category.booking_policy && <p className="mt-3">{booking.category.booking_policy}</p>}
        {booking.property.policies && <p className="mt-3 whitespace-pre-wrap">{booking.property.policies}</p>}
        {booking.special_requests && <p className="mt-3">Requests: {booking.special_requests}</p>}
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}
