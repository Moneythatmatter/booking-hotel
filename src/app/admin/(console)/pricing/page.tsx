"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/components/admin-shell";
import { Banner, Button, Card, Empty, Field, Modal, Select, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage, money } from "@/lib/format";

interface Category {
  id: string;
  name: string;
  base_price: number;
}
interface Rate {
  id: string;
  category_id: string;
  name: string;
  price: number;
  start_date: string | null;
  end_date: string | null;
  min_stay: number;
  is_active: boolean;
  category: { name: string } | null;
}

const blankForm = (categoryId = "", price = 150) => ({
  category_id: categoryId,
  name: "Seasonal",
  price,
  start_date: "",
  end_date: "",
  min_stay: 1,
  is_active: true,
  sync_category_default: false,
});

export default function PricingPage() {
  const { token, property } = useAdmin();
  const [categories, setCategories] = useState<Category[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(blankForm());

  const selectedCategory = categories.find((category) => category.id === form.category_id);

  async function load() {
    const [categoryResult, rateResult] = await Promise.all([
      api<{ data: Category[] }>(`/api/hotelier/properties/${property.id}/categories`, { token }),
      api<{ data: Rate[] }>(`/api/hotelier/properties/${property.id}/rates`, { token }),
    ]);
    setCategories(categoryResult.data);
    setRates(rateResult.data);
  }

  useEffect(() => {
    load()
      .catch((loadError) => setError(errorMessage(loadError)))
      .finally(() => setLoading(false));
  }, [property.id]);

  function openCreate() {
    setEditing(null);
    setError("");
    const first = categories[0];
    setForm(blankForm(first?.id ?? "", Number(first?.base_price ?? 150)));
    setOpen(true);
  }

  function openEdit(rate: Rate) {
    setEditing(rate.id);
    setError("");
    setForm({
      category_id: rate.category_id,
      name: rate.name,
      price: Number(rate.price),
      start_date: rate.start_date ?? "",
      end_date: rate.end_date ?? "",
      min_stay: rate.min_stay,
      is_active: rate.is_active,
      sync_category_default: false,
    });
    setOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const body = {
        ...form,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        sync_category_default: form.sync_category_default,
      };
      if (editing) {
        await api(`/api/hotelier/properties/${property.id}/rates/${editing}`, { method: "PATCH", token, body });
      } else {
        await api(`/api/hotelier/properties/${property.id}/rates`, { method: "POST", token, body });
      }
      setOpen(false);
      setEditing(null);
      await load();
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setPending(false);
    }
  }

  async function remove(rate: Rate) {
    const label = rate.category?.name ? `${rate.name} (${rate.category.name})` : rate.name;
    if (!window.confirm(`Delete rate "${label}"? This cannot be undone.`)) return;
    setError("");
    try {
      await api(`/api/hotelier/properties/${property.id}/rates/${rate.id}`, { method: "DELETE", token });
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
        <Button type="button" disabled={categories.length === 0} onClick={openCreate}>
          Add rate
        </Button>
      </div>
      {!open && error && <Banner>{error}</Banner>}
      {categories.length === 0 && <Empty title="No categories" body="Create a room category before adding rates." />}
      <Modal
        open={open}
        title={editing ? "Edit rate" : "Add rate"}
        onClose={() => {
          setOpen(false);
          setEditing(null);
          setError("");
        }}
      >
        <form onSubmit={save} className="grid gap-4">
          {error && <Banner>{error}</Banner>}
          <Select
            label="Category"
            value={form.category_id}
            onChange={(event) => {
              const category = categories.find((item) => item.id === event.target.value);
              setForm({
                ...form,
                category_id: event.target.value,
                price: editing ? form.price : category ? Number(category.base_price) : form.price,
                sync_category_default: false,
              });
            }}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} · default {money(category.base_price, property.currency)}
              </option>
            ))}
          </Select>
          {selectedCategory && (
            <p className="text-sm text-muted">
              Room category default is <span className="font-semibold text-ink">{money(selectedCategory.base_price, property.currency)}</span> per night.
              Dated rates below only apply on those nights.
            </p>
          )}
          <Field label="Rate name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price" type="number" min={0} step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} />
            <Field label="Minimum nights" type="number" min={1} value={form.min_stay} onChange={(event) => setForm({ ...form, min_stay: Number(event.target.value) })} />
            <Field label="Start (required if no end)" type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} />
            <Field label="End (required if no start)" type="date" value={form.end_date} onChange={(event) => setForm({ ...form, end_date: event.target.value })} />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.sync_category_default}
              onChange={(event) => setForm({ ...form, sync_category_default: event.target.checked })}
            />
            <span>
              Also update the room category <strong>selling price</strong> to this amount (what guests see by default on Room categories).
            </span>
          </label>
          <Button className="w-full" disabled={pending}>
            {pending ? "Saving…" : editing ? "Update rate" : "Save rate"}
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
                <th>Category default</th>
                <th>Dates</th>
                <th>Override price</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => {
                const categoryDefault = categories.find((category) => category.id === rate.category_id)?.base_price;
                return (
                  <tr key={rate.id} className="border-t border-line">
                    <td className="py-3">
                      {rate.name}
                      <p className="text-xs text-muted">{rate.category?.name}</p>
                    </td>
                    <td className="text-muted">{categoryDefault != null ? money(categoryDefault, property.currency) : "—"}</td>
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
                      <span className="inline-flex justify-end gap-2">
                        <button
                          type="button"
                          aria-label={`Edit ${rate.name}`}
                          className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-white text-clay hover:bg-cream"
                          onClick={() => openEdit(rate)}
                        >
                          <PencilIcon />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${rate.name}`}
                          className="grid h-9 w-9 place-items-center rounded-xl border border-red-200 bg-white text-red-800 hover:bg-red-50"
                          onClick={() => remove(rate)}
                        >
                          <TrashIcon />
                        </button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 20h4l10-10-4-4L4 16v4z" />
      <path d="M13 7l4 4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 7h16M9 7V5h6v2M10 11v6M14 11v6M6 7l1 14h10l1-14" />
    </svg>
  );
}