"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/components/admin-shell";
import { Badge, Card, Spinner, statusTone } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage, money } from "@/lib/format";

interface SubscriptionView {
  rooms_used: number;
  subscription: {
    status: string;
    billing_interval: string;
    current_period_start: string;
    current_period_end: string;
    plan: {
      name: string;
      description: string;
      price_monthly: number;
      price_yearly: number;
      max_rooms: number;
      max_properties: number;
      features: string[];
    };
  } | null;
}

export default function SubscriptionPage() {
  const { token, property } = useAdmin();
  const [data, setData] = useState<SubscriptionView | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ data: SubscriptionView }>(`/api/hotelier/properties/${property.id}/subscription`, { token })
      .then((result) => setData(result.data))
      .catch((loadError) => setError(errorMessage(loadError)));
  }, [token, property.id]);

  if (error) return <p className="text-sm text-red-800">{error}</p>;
  if (!data) return <Spinner />;
  const subscription = data.subscription;

  return (
    <div className="grid gap-6">
      <h1 className="font-serif text-4xl">Subscription</h1>
      {!subscription ? (
        <Card>No subscription is attached to this property.</Card>
      ) : (
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-serif text-3xl">{subscription.plan.name}</h2>
            <Badge tone={statusTone(subscription.status)}>{subscription.status}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted">{subscription.plan.description}</p>
          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Billing</dt>
              <dd className="mt-1">
                {subscription.billing_interval} · {money(subscription.billing_interval === "yearly" ? subscription.plan.price_yearly : subscription.plan.price_monthly)}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Current period</dt>
              <dd className="mt-1">
                {subscription.current_period_start} → {subscription.current_period_end}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Rooms</dt>
              <dd className="mt-1">
                {data.rooms_used} of {subscription.plan.max_rooms}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Properties on this plan</dt>
              <dd className="mt-1">Up to {subscription.plan.max_properties}</dd>
            </div>
          </dl>
          <ul className="mt-6 list-disc space-y-1 pl-5 text-sm">
            {(subscription.plan.features || []).map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted">Plan changes, renewals, and subscription payments are handled by the platform admin. Guest payments stay separate.</p>
        </Card>
      )}
    </div>
  );
}
