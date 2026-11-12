"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { errorMessage, money } from "@/lib/format";
import { BookingSteps } from "./booking-steps";
import { Banner, Spinner } from "./ui";

interface BookingView {
  confirmation_code: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  status: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  property: { name: string };
  category: { name: string };
}

export function ConfirmationPage() {
  const search = useSearchParams();
  const code = search.get("code");
  const token = search.get("token");
  const [booking, setBooking] = useState<BookingView | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api<{ data: BookingView }>(`/api/public/bookings/${token}`)
      .then((result) => setBooking(result.data))
      .catch((loadError) => setError(errorMessage(loadError)));
  }, [token]);

  return (
    <main className="min-h-screen bg-white px-4 py-6 text-slate-900">
      <section className="mx-auto w-full max-w-xl rounded-3xl border border-slate-200 p-6">
        <BookingSteps current={5} />
        <p className="mt-6 text-sm font-semibold tracking-[0.14em] text-emerald-700">RESERVATION</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">You are booked{booking ? `, ${booking.guest_name.split(" ")[0]}` : ""}.</h1>
        <p className="mt-3 text-sm text-muted">A confirmation email includes a private link. No guest account is required to view the stay.</p>
        {error && (
          <div className="mt-4">
            <Banner>{error}</Banner>
          </div>
        )}
        {!booking && token && !error && (
          <div className="mt-6">
            <Spinner label="Loading confirmation" />
          </div>
        )}
        <dl className="mt-6 grid gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Code</dt>
            <dd className="font-medium">{booking?.confirmation_code || code}</dd>
          </div>
          {booking && (
            <>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Hotel</dt>
                <dd>{booking.property?.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Room</dt>
                <dd>{booking.category?.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Stay</dt>
                <dd>
                  {booking.check_in} to {booking.check_out}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Status</dt>
                <dd>{booking.status}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Total</dt>
                <dd>{money(booking.total_amount, booking.currency)}</dd>
              </div>
            </>
          )}
        </dl>
        {token && (
          <Link href={`/booking/${token}`} className="mt-6 inline-block text-sm font-medium text-[#f08a2a]">
            Open the private booking link
          </Link>
        )}
      </section>
    </main>
  );
}
