"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/components/admin-shell";
import { RoomCategoryCard } from "@/components/room-category-card";
import { Banner, Button, Empty, Field, ListFilters, Modal, Select, Spinner, TextArea } from "@/components/ui";
import { readLandscape } from "@/lib/image";
import { api } from "@/lib/api";
import { errorMessage, money } from "@/lib/format";

interface Category {
  id: string;
  name: string;
  description: string;
  max_occupancy: number;
  base_price: number;
  amenities: string[];
  images: string[];
  booking_policy: string;
  is_active: boolean;
  size_sqft?: number | null;
  beds?: string;
  original_price?: number | null;
  rate_plan?: string;
  rate_plan_note?: string;
  refundable?: boolean;
  room_count?: number;
}

const blank = {
  name: "",
  description: "",
  max_occupancy: 2,
  base_price: 2000,
  original_price: "" as number | "",
  amenities: "Free Wi-Fi, Multi-channel TV",
  image: "",
  booking_policy: "Non-refundable",
  is_active: true,
  size_sqft: "" as number | "",
  beds: "1 king bed",
  rate_plan: "EP (Room Only)",
  rate_plan_note: "European Plan — Room only, no meals included",
  refundable: false,
  room_count: 1,
};

export default function CategoriesPage() {
  const { token, property } = useAdmin();
  const [rows, setRows] = useState<Category[]>([]);
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);

  async function load() {
    const result = await api<{ data: Category[] }>(`/api/hotelier/properties/${property.id}/categories`, { token });
    setRows(result.data);
  }

  useEffect(() => {
    load()
      .catch((loadError) => setError(errorMessage(loadError)))
      .finally(() => setLoading(false));
  }, [property.id]);

  function payload() {
    return {
      name: form.name,
      description: form.description,
      max_occupancy: form.max_occupancy,
      base_price: form.base_price,
      original_price: form.original_price === "" ? null : Number(form.original_price),
      amenities: form.amenities.split(",").map((item) => item.trim()).filter(Boolean),
      images: form.image ? [form.image] : [],
      booking_policy: form.booking_policy,
      is_active: form.is_active,
      size_sqft: form.size_sqft === "" ? null : Number(form.size_sqft),
      beds: form.beds,
      rate_plan: form.rate_plan,
      rate_plan_note: form.rate_plan_note,
      refundable: form.refundable,
      room_count: form.room_count,
    };
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const path = editing
        ? `/api/hotelier/properties/${property.id}/categories/${editing}`
        : `/api/hotelier/properties/${property.id}/categories`;
      await api(path, { method: editing ? "PATCH" : "POST", token, body: payload() });
      setForm(blank);
      setEditing(null);
      setOpen(false);
      await load();
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setPending(false);
    }
  }

  async function setStatus(row: Category, active: boolean) {
    setPending(true);
    setError("");
    try {
      await api(`/api/hotelier/properties/${property.id}/categories/${row.id}`, {
        method: "PATCH",
        token,
        body: {
          name: row.name,
          description: row.description,
          max_occupancy: row.max_occupancy,
          base_price: Number(row.base_price),
          original_price: row.original_price ?? null,
          amenities: row.amenities || [],
          images: row.images || [],
          booking_policy: row.booking_policy,
          is_active: active,
          size_sqft: row.size_sqft ?? null,
          beds: row.beds || "",
          rate_plan: row.rate_plan || "Room only",
          rate_plan_note: row.rate_plan_note || "",
          refundable: row.refundable !== false,
          room_count: row.room_count || 1,
        },
      });
      await load();
    } catch (statusError) {
      setError(errorMessage(statusError));
    } finally {
      setPending(false);
    }
  }

  const shown = rows.filter((row) => {
    if (q && !`${row.name} ${row.description}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (statusFilter === "active" && !row.is_active) return false;
    if (statusFilter === "inactive" && row.is_active) return false;
    return true;
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Room categories</h1>
          <p className="mt-1 text-sm text-muted">The room types guests see and book. Set how many of each type you have.</p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditing(null);
            setForm(blank);
            setError("");
            setOpen(true);
          }}
        >
          Add category
        </Button>
      </div>
      {!open && error && <Banner>{error}</Banner>}
      <ListFilters
        query={draft}
        onQueryChange={setDraft}
        onSearch={() => setQ(draft.trim())}
        placeholder="Search room category"
        status={statusFilter}
        onStatusChange={setStatusFilter}
        statuses={[
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ]}
      />
      <Modal open={open} title={editing ? "Edit category" : "Add category"} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="grid gap-4">
          {error && <Banner>{error}</Banner>}
          <Field label="Name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <TextArea label="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Room photo</span>
            <input
              className="block w-full text-sm"
              type="file"
              accept="image/jpeg,image/png"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  setForm({ ...form, image: await readLandscape(file) });
                  setError("");
                } catch (imageError) {
                  setError(errorMessage(imageError));
                }
              }}
            />
            {form.image && <img src={form.image} alt="" className="mt-3 h-28 w-full rounded-xl object-cover" />}
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Selling price / night" type="number" min={0} step="0.01" value={form.base_price} onChange={(event) => setForm({ ...form, base_price: Number(event.target.value) })} />
            <Field label="Original price / night" type="number" min={0} step="0.01" value={form.original_price} onChange={(event) => setForm({ ...form, original_price: event.target.value === "" ? "" : Number(event.target.value) })} />
            <Field label="How many rooms" type="number" min={1} value={form.room_count} onChange={(event) => setForm({ ...form, room_count: Number(event.target.value) })} />
            <Field label="Max guests" type="number" min={1} value={form.max_occupancy} onChange={(event) => setForm({ ...form, max_occupancy: Number(event.target.value) })} />
            <Field label="Size (sq ft)" type="number" min={0} value={form.size_sqft} onChange={(event) => setForm({ ...form, size_sqft: event.target.value === "" ? "" : Number(event.target.value) })} />
            <Field label="Beds" value={form.beds} onChange={(event) => setForm({ ...form, beds: event.target.value })} />
          </div>
          <Field label="Rate plan" value={form.rate_plan} onChange={(event) => setForm({ ...form, rate_plan: event.target.value })} />
          <Field label="Rate plan note" value={form.rate_plan_note} onChange={(event) => setForm({ ...form, rate_plan_note: event.target.value })} />
          <Field label="Amenities, comma separated" value={form.amenities} onChange={(event) => setForm({ ...form, amenities: event.target.value })} />
          <TextArea label="Booking policy" value={form.booking_policy} onChange={(event) => setForm({ ...form, booking_policy: event.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.refundable} onChange={(event) => setForm({ ...form, refundable: event.target.checked })} />
            Refundable
          </label>
          <Select label="Status" value={form.is_active ? "active" : "inactive"} onChange={(event) => setForm({ ...form, is_active: event.target.value === "active" })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <Button className="w-full" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </form>
      </Modal>
      {loading ? (
        <Spinner />
      ) : shown.length === 0 ? (
        <Empty title="No categories yet" body={q || statusFilter ? "Nothing matches this search." : "Add a room type such as Deluxe or Suite, including the photo, price, and how many you have."} />
      ) : (
        <div className="grid gap-3">
          {shown.map((row) => {
            const price = Number(row.base_price);
            const save = row.original_price && row.original_price > price ? Math.round((1 - price / row.original_price) * 100) : 0;
            return (
              <RoomCategoryCard
                key={row.id}
                name={row.name}
                description={row.description}
                images={row.images}
                sizeSqft={row.size_sqft}
                beds={row.beds}
                maxGuests={row.max_occupancy}
                amenities={row.amenities}
                ratePlan={row.rate_plan}
                ratePlanNote={row.rate_plan_note}
                originalPrice={row.original_price}
                price={price}
                currency={property.currency}
                refundable={row.refundable}
                savePercent={save}
                badge={`${row.room_count || 0} room${row.room_count === 1 ? "" : "s"}`}
                badgeTone="plain"
                onEdit={() => {
                  setEditing(row.id);
                  setError("");
                  setOpen(true);
                  setForm({
                    name: row.name,
                    description: row.description,
                    max_occupancy: row.max_occupancy,
                    base_price: price,
                    amenities: (row.amenities || []).join(", "),
                    image: (row.images || [])[0] || "",
                    booking_policy: row.booking_policy,
                    is_active: row.is_active,
                    size_sqft: row.size_sqft ?? "",
                    beds: row.beds || "",
                    original_price: row.original_price ?? "",
                    rate_plan: row.rate_plan || "Room only",
                    rate_plan_note: row.rate_plan_note || "",
                    refundable: row.refundable !== false,
                    room_count: row.room_count || 1,
                  });
                }}
                action={
                  <label className="block w-full text-right text-sm">
                    <span className="mb-1.5 block text-xs font-medium text-slate-500">Status</span>
                    <select
                      className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-left text-sm text-ink outline-none focus:border-clay focus:ring-2 focus:ring-clay/20"
                      value={row.is_active ? "active" : "inactive"}
                      disabled={pending}
                      onChange={(event) => setStatus(row, event.target.value === "active")}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
