"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/components/admin-shell";
import { Card, Empty, ListFilters, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/format";

interface Guest {
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  stays: number;
  last_stay: string;
}

export default function GuestsPage() {
  const { token, property } = useAdmin();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ data: Guest[] }>(`/api/hotelier/properties/${property.id}/guests`, { token })
      .then((result) => setGuests(result.data))
      .catch((loadError) => setError(errorMessage(loadError)))
      .finally(() => setLoading(false));
  }, [token, property.id]);

  const shown = guests.filter((guest) => {
    if (!q) return true;
    return `${guest.guest_name} ${guest.guest_email} ${guest.guest_phone ?? ""}`.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div className="grid gap-6">
      <h1 className="font-serif text-4xl">Guests</h1>
      <ListFilters query={draft} onQueryChange={setDraft} onSearch={() => setQ(draft.trim())} placeholder="Search name, email, or phone" />
      {error && <p className="text-sm text-red-800">{error}</p>}
      {loading ? (
        <Spinner />
      ) : shown.length === 0 ? (
        <Empty title="No guests yet" body={q ? "Nothing matches this search." : "Guest details are collected from reservations."} />
      ) : (
      <Card>
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="py-2">Guest</th>
              <th>Stays</th>
              <th>Last arrival</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((guest) => (
              <tr key={guest.guest_email} className="border-t border-line">
                <td className="py-3">
                  <p>{guest.guest_name}</p>
                  <p className="text-xs text-muted">
                    {guest.guest_email}
                    {guest.guest_phone ? ` · ${guest.guest_phone}` : ""}
                  </p>
                </td>
                <td>{guest.stays}</td>
                <td>{guest.last_stay}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      )}
    </div>
  );
}
