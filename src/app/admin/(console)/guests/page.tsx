"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/components/admin-shell";
import { Card, Empty, Spinner } from "@/components/ui";
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ data: Guest[] }>(`/api/hotelier/properties/${property.id}/guests`, { token })
      .then((result) => setGuests(result.data))
      .catch((loadError) => setError(errorMessage(loadError)))
      .finally(() => setLoading(false));
  }, [token, property.id]);

  if (loading) return <Spinner />;
  if (error) return <p className="text-sm text-red-800">{error}</p>;
  if (guests.length === 0) return <Empty title="No guests yet" body="Guest details are collected from reservations." />;

  return (
    <div className="grid gap-6">
      <h1 className="font-serif text-4xl">Guests</h1>
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
            {guests.map((guest) => (
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
    </div>
  );
}
