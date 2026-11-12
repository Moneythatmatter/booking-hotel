"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/components/admin-shell";
import { Banner, Button, Card, Field, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/format";

interface Widget {
  booking_url: string;
  embed_code: string;
  settings: { primary_color?: string; button_label?: string; show_policies?: boolean };
  payments_enabled: boolean;
}

export default function WidgetPage() {
  const { token, property } = useAdmin();
  const [widget, setWidget] = useState<Widget | null>(null);
  const [color, setColor] = useState("#9a3412");
  const [label, setLabel] = useState("Reserve");
  const [showPolicies, setShowPolicies] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    api<{ data: Widget }>(`/api/hotelier/properties/${property.id}/widget`, { token })
      .then((result) => {
        setWidget(result.data);
        setColor(result.data.settings.primary_color || "#9a3412");
        setLabel(result.data.settings.button_label || "Reserve");
        setShowPolicies(result.data.settings.show_policies !== false);
      })
      .catch((loadError) => setError(errorMessage(loadError)));
  }, [token, property.id]);

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setMessage("Copied.");
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    try {
      const result = await api<{ data: Widget }>(`/api/hotelier/properties/${property.id}/widget`, {
        method: "PATCH",
        token,
        body: { primary_color: color, button_label: label, show_policies: showPolicies },
      });
      setWidget(result.data);
      setMessage("Widget settings saved.");
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setPending(false);
    }
  }

  if (!widget && !error) return <Spinner />;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-serif text-4xl">Booking widget</h1>
        <p className="mt-1 text-sm text-muted">Share the direct URL or embed the same booking page on the hotel website.</p>
      </div>
      {error && <Banner>{error}</Banner>}
      {message && <Banner tone="ok">{message}</Banner>}
      {widget && (
        <>
          <Card>
            <p className="text-sm font-medium">Booking URL</p>
            <p className="mt-2 break-all text-sm">{widget.booking_url}</p>
            <Button className="mt-4" variant="ghost" onClick={() => copy(widget.booking_url)}>
              Copy URL
            </Button>
          </Card>
          <Card>
            <p className="text-sm font-medium">Embed code</p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-cream p-3 text-xs">{widget.embed_code}</pre>
            <Button className="mt-4" variant="ghost" onClick={() => copy(widget.embed_code)}>
              Copy embed
            </Button>
          </Card>
          <form onSubmit={save}>
            <Card className="grid gap-4">
              <Field label="Button label" value={label} onChange={(event) => setLabel(event.target.value)} />
              <Field label="Accent color" type="color" value={color} onChange={(event) => setColor(event.target.value)} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showPolicies} onChange={(event) => setShowPolicies(event.target.checked)} />
                Show booking policy
              </label>
              <p className="text-sm text-muted">Online guest payment is {widget.payments_enabled ? "enabled" : "off. Guests can pay at the property."}</p>
              <Button disabled={pending}>{pending ? "Saving…" : "Save widget"}</Button>
            </Card>
          </form>
        </>
      )}
    </div>
  );
}
