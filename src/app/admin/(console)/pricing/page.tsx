"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/components/admin-shell";
import { Banner, Button, Card, Empty, Field, Modal, Select, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage, money } from "@/lib/format";

interface Category {
  id: string;
  name: string;
}
interface Rate {
  id: string;
  name: string;
  price: number;
  start_date: string | null;
  end_date: string | null;
  min_stay: number;
  is_active: boolean;
  category: { name: string } | null;
}

export default function PricingPage() {
  const { token, property } = useAdmin();
  const [categories, setCategories] = useState<Category[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category_id: "", name: "Seasonal", price: 150, start_date: "", end_date: "", min_stay: 1, is_active: true });

  async function load() {
    const [categoryResult, rateResult] = await Promise.all([
      api<{ data: Category[] }>(`/api/hotelier/properties/${property.id}/categories`, { token }),
      api<{ data: Rate[] }>(`/api/hotelier/properties/${property.id}/rates`, { token }),
    ]);
    setCategories(categoryResult.data);
    setRates(rateResult.data);
    setForm((current) => ({ ...current, category_id: current.category_id || categoryResult.data[0]?.id || "" }));
  }

  useEffect(() => {
    load()
      .catch((loadError) => setError(errorMessage(loadError)))
      .finally(() => setLoading(false));
  }, [property.id]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await api(`/api/hotelier/properties/${property.id}/rates`, {
        method: "POST",
        token,
        body: { ...form, start_date: form.start_date || null, end_date: form.end_date || null },
      });
      setForm({ ...form, name: "Seasonal", price: 150, start_date: "", end_date: "" });
      setOpen(false);
      await load();
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setPending(false);
    }
  }

  async function remove(id: string) {
    try {
      await api(`/api/hotelier/properties/${property.id}/rates/${id}`, { method: "DELETE", token });
      await load();
    } catch (deleteError) {
      setError(errorMessage(deleteError));
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pricing</h1>
          <p className="mt-1 text-sm text-muted">Selling price on each room category is the default. Add a rate here only when you need a dated override. Availability can still set a price per night.</p>
        </div>
        <Button type="button" disabled={categories.length === 0} onClick={() => { setError(""); setOpen(true); }}>
          Add rate
        </Button>
      </div>
      {!open && error && <Banner>{error}</Banner>}
      {categories.length === 0 && <Empty title="No categories" body="Create a room category before adding rates." />}
      <Modal open={open} title="Add rate" onClose={() => setOpen(false)}>
        <form onSubmit={save} className="grid gap-4">
          {error && <Banner>{error}</Banner>}
          <Select label="Category" value={form.category_id} onChange={(event) => setForm({ ...form, category_id: event.target.value })}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Field label="Rate name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price" type="number" min={0} step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} />
            <Field label="Minimum nights" type="number" min={1} value={form.min_stay} onChange={(event) => setForm({ ...form, min_stay: Number(event.target.value) })} />
            <Field label="Start (required if no end)" type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} />
            <Field label="End (required if no start)" type="date" value={form.end_date} onChange={(event) => setForm({ ...form, end_date: event.target.value })} />
          </div>
          <Button className="w-full" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </form>
      </Modal>
      {rates.length === 0 ? (
        <Empty title="No seasonal rates" body="The base price is used until you add a rate." />
      ) : (
        <Card>
          <table className="w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-2">Rate</th>
                <th>Dates</th>
                <th>Price</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => (
                <tr key={rate.id} className="border-t border-line">
                  <td className="py-3">
                    {rate.name}
                    <p className="text-xs text-muted">{rate.category?.name}</p>
                  </td>
                  <td>
                    {!rate.start_date && !rate.end_date ? (
                      <span className="text-amber-800">No dates — not applied (category price is used). Add dates or delete.</span>
                    ) : (
                      <>
                        {rate.start_date || "Open"} → {rate.end_date || "Open"} · min {rate.min_stay}
                      </>
                    )}
                  </td>
                  <td>{money(rate.price, property.currency)}</td>
                  <td className="text-right">
                    <button className="text-red-800" onClick={() => remove(rate.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
