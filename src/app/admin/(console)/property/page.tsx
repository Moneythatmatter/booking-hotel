"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/components/admin-shell";
import { Banner, Button, Field, Modal, TextArea } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/format";
import { readLandscape } from "@/lib/image";

interface PropertyForm {
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  timezone: string;
  currency: string;
  check_in_time: string;
  check_out_time: string;
  policies: string;
  cover_image_url?: string | null;
  widget_settings?: { cover_image_url?: string };
}

const empty: PropertyForm = {
  name: "",
  description: "",
  address: "",
  city: "",
  country: "",
  phone: "",
  email: "",
  timezone: "UTC",
  currency: "USD",
  check_in_time: "15:00",
  check_out_time: "11:00",
  policies: "",
};

export default function PropertyPage() {
  const { token, property, properties, setPropertyId, refresh } = useAdmin();
  const [form, setForm] = useState<PropertyForm>(empty);
  const [extra, setExtra] = useState({ name: "", city: "", country: "", currency: property.currency, timezone: property.timezone });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [photo, setPhoto] = useState("");
  const [createPhoto, setCreatePhoto] = useState("");
  const canWrite = (property.page_access?.property ?? "write") === "write";

  useEffect(() => {
    api<{ data: PropertyForm }>(`/api/hotelier/properties/${property.id}`, { token })
      .then((result) => setForm({ ...empty, ...result.data, phone: result.data.phone || "", email: result.data.email || "" }))
      .catch((loadError) => setError(errorMessage(loadError)));
  }, [token, property.id]);

  function set<K extends keyof PropertyForm>(key: K, value: PropertyForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function choosePhoto(file: File | undefined, target: "edit" | "create") {
    if (!file) return;
    setError("");
    try {
      const image = await readLandscape(file);
      if (target === "edit") setPhoto(image);
      else setCreatePhoto(image);
    } catch (photoError) {
      setError(errorMessage(photoError));
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    try {
      await api(`/api/hotelier/properties/${property.id}`, { method: "PATCH", token, body: { ...form, phone: form.phone || null, email: form.email } });
      if (photo) {
        const uploaded = await api<{ data: { cover_image_url: string } }>(`/api/hotelier/properties/${property.id}/cover`, { method: "POST", token, body: { image: photo } });
        setForm((current) => ({ ...current, cover_image_url: uploaded.data.cover_image_url }));
        setPhoto("");
      }
      setEditing(false);
      setMessage("Property saved.");
      await refresh();
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setPending(false);
    }
  }

  async function addProperty(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const created = await api<{ data: { id: string } }>("/api/auth/properties", { method: "POST", token, body: extra });
      if (createPhoto) {
        await api(`/api/hotelier/properties/${created.data.id}/cover`, { method: "POST", token, body: { image: createPhoto } });
      }
      setExtra({ name: "", city: "", country: "", currency: property.currency, timezone: property.timezone });
      setCreatePhoto("");
      setCreating(false);
      setPropertyId(created.data.id);
      setMessage("Property added.");
      await refresh();
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setPending(false);
    }
  }

  const cover = photo || form.cover_image_url || form.widget_settings?.cover_image_url || property.cover_image_url;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Property</h1>
        {property.role === "owner" && (
          <Button type="button" onClick={() => { setError(""); setCreating(true); }}>
            Add property
          </Button>
        )}
      </div>
      {error && !creating && !editing && <Banner>{error}</Banner>}
      {message && <Banner tone="ok">{message}</Banner>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {properties.map((item) => (
          <button
            key={item.id}
            type="button"
            className="overflow-hidden rounded-2xl border border-line bg-white text-left shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
            onClick={() => {
              setError("");
              setPhoto("");
              setForm(empty);
              setPropertyId(item.id);
              setEditing(true);
            }}
          >
            <div className="aspect-[16/9] bg-[#e7f6ec]">
              {item.cover_image_url ? <img src={item.cover_image_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-sm text-muted">Landscape photo</div>}
            </div>
            <div className="p-4">
              <p className="font-semibold">{item.name}</p>
              <p className="mt-1 text-sm text-muted">{[item.city, item.country].filter(Boolean).join(", ") || "No location yet"}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-clay">{item.id === property.id ? "Active" : item.role}</p>
            </div>
          </button>
        ))}
      </div>

      <Modal open={editing} title="Edit property" onClose={() => setEditing(false)}>
        <form onSubmit={save} className="grid gap-4">
          {error && <Banner>{error}</Banner>}
          <div className="overflow-hidden rounded-2xl border border-line bg-[#e7f6ec]">
            <div className="aspect-[16/9]">
              {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-sm text-muted">Add a landscape photo</div>}
            </div>
          </div>
          {canWrite && (
            <label className="text-sm">
              <span className="mb-1.5 block font-medium">Landscape photo</span>
              <input className="block w-full text-sm" type="file" accept="image/jpeg,image/png" onChange={(event) => void choosePhoto(event.target.files?.[0], "edit")} />
            </label>
          )}
          <Field label="Name" required value={form.name} onChange={(event) => set("name", event.target.value)} />
          <TextArea label="Description" value={form.description} onChange={(event) => set("description", event.target.value)} />
          <Field label="Address" value={form.address} onChange={(event) => set("address", event.target.value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City" value={form.city} onChange={(event) => set("city", event.target.value)} />
            <Field label="Country" value={form.country} onChange={(event) => set("country", event.target.value)} />
            <Field label="Phone" value={form.phone} onChange={(event) => set("phone", event.target.value)} />
            <Field label="Email" type="email" value={form.email} onChange={(event) => set("email", event.target.value)} />
            <Field label="Timezone" value={form.timezone} onChange={(event) => set("timezone", event.target.value)} />
            <Field label="Currency" maxLength={3} value={form.currency} onChange={(event) => set("currency", event.target.value.toUpperCase())} />
            <Field label="Check-in" type="time" value={form.check_in_time.slice(0, 5)} onChange={(event) => set("check_in_time", event.target.value)} />
            <Field label="Check-out" type="time" value={form.check_out_time.slice(0, 5)} onChange={(event) => set("check_out_time", event.target.value)} />
          </div>
          <TextArea label="Booking policy" value={form.policies} onChange={(event) => set("policies", event.target.value)} />
          {canWrite && <Button className="w-full" disabled={pending}>{pending ? "Saving…" : "Save property"}</Button>}
        </form>
      </Modal>

      <Modal open={creating} title="Add property" onClose={() => setCreating(false)}>
        <form onSubmit={addProperty} className="grid gap-4">
          {error && <Banner>{error}</Banner>}
          <p className="text-sm text-muted">Available when your plan’s property limit is higher than the hotels you already own. The photo should be landscape.</p>
          {createPhoto && <img src={createPhoto} alt="" className="aspect-[16/9] w-full rounded-2xl object-cover" />}
          <label className="text-sm">
            <span className="mb-1.5 block font-medium">Landscape photo</span>
            <input className="block w-full text-sm" type="file" accept="image/jpeg,image/png" onChange={(event) => void choosePhoto(event.target.files?.[0], "create")} />
          </label>
          <Field label="Name" required value={extra.name} onChange={(event) => setExtra({ ...extra, name: event.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City" value={extra.city} onChange={(event) => setExtra({ ...extra, city: event.target.value })} />
            <Field label="Country" value={extra.country} onChange={(event) => setExtra({ ...extra, country: event.target.value })} />
          </div>
          <Button className="w-full" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
        </form>
      </Modal>
    </div>
  );
}
