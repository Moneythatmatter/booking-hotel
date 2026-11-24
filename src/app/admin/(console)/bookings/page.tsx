"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/components/admin-shell";
import { Badge, Banner, Card, Empty, Field, Select, Spinner, statusTone } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage, money } from "@/lib/format";

interface Room {
  id: string;
  room_number: string;
  category_id: string;
  status: string;
}
interface Booking {
  id: string;
  confirmation_code: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  status: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  special_requests: string;
  category_id: string;
  room_id: string | null;
  category: { name: string } | null;
  room: { room_number: string } | null;
}

export default function BookingsPage() {
  const { token, property } = useAdmin();
  const canManage = property.permissions.includes("bookings.manage");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);

  async function load(nextStatus = status, nextQuery = q) {
    const query = new URLSearchParams({ limit: "50" });
    if (nextStatus) query.set("status", nextStatus);
    if (nextQuery) query.set("q", nextQuery);
    const result = await api<{ data: { bookings: Booking[] } }>(`/api/hotelier/properties/${property.id}/bookings?${query}`, { token });
    setBookings(result.data.bookings);
    if (canManage && property.permissions.includes("rooms.manage")) {
      const roomResult = await api<{ data: Room[] }>(`/api/hotelier/properties/${property.id}/rooms`, { token });
      setRooms(roomResult.data);
    }
  }

  useEffect(() => {
    load()
      .catch((loadError) => setError(errorMessage(loadError)))
      .finally(() => setLoading(false));
  }, [property.id]);

  async function update(id: string, body: { status?: string; room_id?: string | null }) {
    setError("");
    try {
      await api(`/api/hotelier/properties/${property.id}/bookings/${id}`, { method: "PATCH", token, body });
      await load();
      setSelected(null);
    } catch (updateError) {
      setError(errorMessage(updateError));
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="grid gap-6">
      <h1 className="font-serif text-4xl">Bookings</h1>
      {error && <Banner>{error}</Banner>}
      <form
        className="grid gap-3 md:grid-cols-[1fr_180px_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          load().catch((loadError) => setError(errorMessage(loadError)));
        }}
      >
        <Field label="Search" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Name, email, or code" />
        <Select
          label="Status"
          value={status}
          onChange={(event) => {
            const next = event.target.value;
            setStatus(next);
            load(next, q).catch((loadError) => setError(errorMessage(loadError)));
          }}
        >
          <option value="">All</option>
          {["pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"].map((item) => (
            <option key={item} value={item}>
              {item.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
        <div className="flex items-end">
          <button className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm">Filter</button>
        </div>
      </form>
      {bookings.length === 0 ? (
        <Empty title="No bookings" body="Reservations from the public page will show up here." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="py-2">Guest</th>
                  <th>Stay</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="cursor-pointer border-t border-line" onClick={() => setSelected(booking)}>
                    <td className="py-3">
                      <p>{booking.guest_name}</p>
                      <p className="text-xs text-muted">{booking.guest_email}</p>
                    </td>
                    <td>
                      {booking.check_in} → {booking.check_out}
                      <p className="text-xs text-muted">{booking.category?.name}</p>
                    </td>
                    <td>
                      <Badge tone={statusTone(booking.status)}>{booking.status.replaceAll("_", " ")}</Badge>
                    </td>
                    <td>{money(booking.total_amount, booking.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {selected && (
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-3xl">{selected.guest_name}</h2>
              <p className="text-sm text-muted">
                {selected.confirmation_code} · {selected.guest_email} {selected.guest_phone ? `· ${selected.guest_phone}` : ""}
              </p>
            </div>
            <button className="text-sm text-muted" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
          <p className="mt-4 text-sm">
            {selected.adults} adults, {selected.children} children. Payment: {selected.payment_status}.
          </p>
          {selected.special_requests && <p className="mt-2 text-sm text-muted">{selected.special_requests}</p>}
          {canManage && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selected.status === "confirmed" && (
                <button className="rounded-xl bg-ink px-3 py-2 text-sm text-white" onClick={() => update(selected.id, { status: "checked_in" })}>
                  Check in
                </button>
              )}
              {selected.status === "checked_in" && (
                <button className="rounded-xl bg-ink px-3 py-2 text-sm text-white" onClick={() => update(selected.id, { status: "checked_out" })}>
                  Check out
                </button>
              )}
              {selected.status === "confirmed" && (
                <button className="rounded-xl border border-line px-3 py-2 text-sm" onClick={() => update(selected.id, { status: "no_show" })}>
                  No-show
                </button>
              )}
              {["pending", "confirmed"].includes(selected.status) && (
                <button className="rounded-xl bg-red-800 px-3 py-2 text-sm text-white" onClick={() => update(selected.id, { status: "cancelled" })}>
                  Cancel and release rooms
                </button>
              )}
              {selected.status === "pending" && (
                <button className="rounded-xl border border-line px-3 py-2 text-sm" onClick={() => update(selected.id, { status: "confirmed" })}>
                  Confirm without payment
                </button>
              )}
            </div>
          )}
          {canManage && (
            <label className="mt-4 block text-sm">
              <span className="mb-1.5 block font-medium">Assign room</span>
              <select
                className="w-full rounded-xl border border-line bg-white px-3 py-2.5"
                value={selected.room_id || ""}
                onChange={(event) => update(selected.id, { room_id: event.target.value || null })}
              >
                <option value="">Unassigned</option>
                {rooms
                  .filter((room) => room.category_id === selected.category_id && room.status === "available")
                  .map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.room_number}
                    </option>
                  ))}
              </select>
            </label>
          )}
        </Card>
      )}
    </div>
  );
}
