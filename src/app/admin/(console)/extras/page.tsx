"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/components/admin-shell";
import { Banner, Button, Card, Empty, Field, ListFilters, Modal, Spinner, TextArea } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage, money } from "@/lib/format";

interface Extra {
  id?: string;
  name: string;
  description: string;
  price: number;
  charge: "per_night" | "per_stay";
  is_active: boolean;
}

const blank: Extra = { name: "", description: "", price: 500, charge: "per_night", is_active: true };

export default function ExtrasPage() {
  const { token, property } = useAdmin();
  const [rows, setRows] = useState<Extra[]>([]);
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState<Extra>(blank);
  const [editing, setEditing] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    api<{ data: Extra[] }>(`/api/hotelier/properties/${property.id}/extras`, { token })
      .then((result) => setRows(result.data ?? []))
      .catch((loadError) => setError(errorMessage(loadError)))
      .finally(() => setLoading(false));
  }, [property.id, token]);

  async function persist(next: Extra[]) {
    const result = await api<{ data: Extra[] }>(`/api/hotelier/properties/${property.id}/extras`, { method: "PUT", token, body: { extras: next } });
    setRows(result.data);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const next = [...rows];
      if (editing == null) next.push(form);
      else next[editing] = form;
      await persist(next);
      setOpen(false);
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setPending(false);
    }
  }

  async function remove(index: number) {
    if (!window.confirm("Delete this extra?")) return;
    setError("");
    try {
      await persist(rows.filter((_, item) => item !== index));
    } catch (deleteError) {
      setError(errorMessage(deleteError));
    }
  }

  const shown = rows.filter((row) => {
    if (q && !`${row.name} ${row.description}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (status === "active" && !row.is_active) return false;
    if (status === "hidden" && row.is_active) return false;
    return true;
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Extras</h1>
          <p className="mt-1 text-sm text-muted">Add-ons guests can choose after they pick a room, such as an extra bed.</p>
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
          Add extra
        </Button>
      </div>
      {!open && error && <Banner>{error}</Banner>}
      <ListFilters
        query={draft}
        onQueryChange={setDraft}
        onSearch={() => setQ(draft.trim())}
        placeholder="Search extras"
        status={status}
        onStatusChange={setStatus}
        statuses={[
          { value: "active", label: "Active" },
          { value: "hidden", label: "Hidden" },
        ]}
      />
      <Modal open={open} title={editing == null ? "Add extra" : "Edit extra"} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="grid gap-4">
          {error && <Banner>{error}</Banner>}
          <Field label="Name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <TextArea label="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price" type="number" min={0} step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} />
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Charge</span>
              <select className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm" value={form.charge} onChange={(event) => setForm({ ...form, charge: event.target.value as Extra["charge"] })}>
                <option value="per_night">Per night</option>
                <option value="per_stay">Per stay</option>
              </select>
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
            Active
          </label>
          <Button className="w-full" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
        </form>
      </Modal>
      {loading ? (
        <Spinner />
      ) : shown.length === 0 ? (
        <Empty title="No extras yet" body={q || status ? "Nothing matches this search." : "Add an extra bed, breakfast, or airport pickup for guests to add during booking."} />
      ) : (
        <div className="grid gap-3">
          {shown.map((row) => {
            const index = rows.indexOf(row);
            return (
            <Card key={row.id || row.name} className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <p className="font-medium">{row.name}</p>
                <p className="text-sm text-muted">
                  {money(row.price, property.currency)} · {row.charge === "per_stay" ? "per stay" : "per night"} · {row.is_active ? "active" : "hidden"}
                </p>
                {row.description && <p className="mt-1 text-sm text-muted">{row.description}</p>}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => { setEditing(index); setForm(row); setError(""); setOpen(true); }}>Edit</Button>
                <Button variant="danger" onClick={() => remove(index)}>Delete</Button>
              </div>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
