"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/components/admin-shell";
import { Banner, Button, Card, Empty, Field, Modal, Select, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { addLocalDays, errorMessage, localIso, money } from "@/lib/format";

interface Category {
  id: string;
  name: string;
}
interface InventoryRow {
  id: string;
  date: string;
  total_rooms: number;
  available_rooms: number;
  price_override: number | null;
  stop_sell: boolean;
  category_id: string;
}

export default function AvailabilityPage() {
  const { token, property } = useAdmin();
  const today = localIso(new Date());
  const [categories, setCategories] = useState<Category[]>([]);
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(addLocalDays(today, 13));
  const [stopSell, setStopSell] = useState(false);
  const [price, setPrice] = useState("");
  const [clearPrice, setClearPrice] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);

  async function load(nextCategory = categoryId, nextStart = start, nextEnd = end) {
    const categoryResult = await api<{ data: Category[] }>(`/api/hotelier/properties/${property.id}/categories`, { token });
    setCategories(categoryResult.data);
    const selected = nextCategory || categoryResult.data[0]?.id || "";
    setCategoryId(selected);
    if (!selected) {
      setRows([]);
      return;
    }
    const query = new URLSearchParams({ category_id: selected, start_date: nextStart, end_date: nextEnd });
    const inventory = await api<{ data: InventoryRow[] }>(`/api/hotelier/properties/${property.id}/inventory?${query}`, { token });
    setRows(inventory.data);
  }

  useEffect(() => {
    load()
      .catch((loadError) => setError(errorMessage(loadError)))
      .finally(() => setLoading(false));
  }, [property.id]);

  async function apply(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    try {
      const result = await api<{ data: { updated: number } }>(`/api/hotelier/properties/${property.id}/inventory`, {
        method: "PATCH",
        token,
        body: {
          category_id: categoryId,
          start_date: start,
          end_date: end,
          stop_sell: stopSell,
          clear_price_override: clearPrice,
          ...(price !== "" && !clearPrice ? { price_override: Number(price) } : {}),
        },
      });
      setMessage(`Updated ${result.data.updated} nights.`);
      setOpen(false);
      await load(categoryId, start, end);
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setPending(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Availability</h1>
          <p className="mt-1 text-sm text-muted">Close dates or set a special nightly price. Room counts follow rooms minus reservations.</p>
        </div>
        <Button type="button" disabled={categories.length === 0} onClick={() => { setError(""); setOpen(true); }}>
          Update nights
        </Button>
      </div>
      {!open && error && <Banner>{error}</Banner>}
      {message && <Banner tone="ok">{message}</Banner>}
      {categories.length === 0 ? (
        <Empty title="Nothing to sell yet" body="Add a category and at least one available room." />
      ) : (
        <>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              load().catch((loadError) => setError(errorMessage(loadError)));
            }}
          >
            <Card className="grid gap-4 md:grid-cols-4">
              <Select label="Category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
              <Field label="From" type="date" value={start} onChange={(event) => setStart(event.target.value)} />
              <Field label="To" type="date" value={end} onChange={(event) => setEnd(event.target.value)} />
              <div className="flex items-end">
                <Button variant="ghost" className="w-full" type="submit">
                  Show nights
                </Button>
              </div>
            </Card>
          </form>
          <Modal open={open} title="Update nights" onClose={() => setOpen(false)}>
            <form onSubmit={apply} className="grid gap-4">
              {error && <Banner>{error}</Banner>}
              <p className="text-sm text-muted">
                Applies to the dates currently shown, {start} to {end}.
              </p>
              <Field label="Price override" type="number" min={0} step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Leave blank to keep" />
              <label className="flex gap-2 text-sm">
                <input type="checkbox" checked={stopSell} onChange={(event) => setStopSell(event.target.checked)} />
                Stop sell for this range
              </label>
              <label className="flex gap-2 text-sm">
                <input type="checkbox" checked={clearPrice} onChange={(event) => setClearPrice(event.target.checked)} />
                Clear price override
              </label>
              <Button className="w-full" disabled={pending}>
                {pending ? "Updating…" : "Save"}
              </Button>
            </form>
          </Modal>
          {rows.length === 0 ? (
            <Empty title="No inventory in this range" body="Add an available room so the next 18 months of nights are created." />
          ) : (
            <Card>
              <table className="w-full text-left text-sm">
                <thead className="text-muted">
                  <tr>
                    <th className="py-2">Date</th>
                    <th>Open</th>
                    <th>Override</th>
                    <th>Stop sell</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-line">
                      <td className="py-2">{row.date}</td>
                      <td>
                        {row.available_rooms} / {row.total_rooms}
                      </td>
                      <td>{row.price_override == null ? "—" : money(row.price_override, property.currency)}</td>
                      <td>{row.stop_sell ? "Closed" : "Open"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
