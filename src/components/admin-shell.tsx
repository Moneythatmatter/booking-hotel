"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/format";
import { createClient } from "@/lib/supabase";
import { deskIcons, IconLogout, IconPortal } from "./desk-icons";
import { Banner, Button, Field, Spinner, initials } from "./ui";

export interface PropertyAccess {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  role: "owner" | "manager" | "staff";
  status: string;
  currency: string;
  timezone: string;
  cover_image_url?: string | null;
  page_access?: Record<string, "none" | "read" | "write">;
  permissions: string[];
  subscription: {
    status: string;
    current_period_end: string;
    plan: { name: string; max_rooms: number; max_properties: number } | null;
  } | null;
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
  platform_role: string;
  status: string;
}

interface AdminState {
  token: string;
  profile: Profile;
  properties: PropertyAccess[];
  property: PropertyAccess;
  setPropertyId: (id: string) => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AdminContext = createContext<AdminState | null>(null);

export function useAdmin() {
  const value = useContext(AdminContext);
  if (!value) throw new Error("useAdmin must be used inside the hotelier console.");
  return value;
}

const links = [
  { href: "/admin", label: "Dashboard", page: "dashboard" },
  { href: "/admin/property", label: "Property", page: "property" },
  { href: "/admin/categories", label: "Room categories", page: "categories" },
  { href: "/admin/extras", label: "Extras", page: "extras" },
  { href: "/admin/pricing", label: "Pricing", page: "pricing" },
  { href: "/admin/availability", label: "Availability", page: "availability" },
  { href: "/admin/bookings", label: "Bookings", page: "bookings" },
  { href: "/admin/guests", label: "Guests", page: "guests" },
  { href: "/admin/subscription", label: "Subscription", page: "subscription" },
  { href: "/admin/widget", label: "Booking widget", page: "widget" },
  { href: "/admin/activity", label: "Activity", page: "activity" },
  { href: "/admin/users", label: "Users", page: "users" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [properties, setProperties] = useState<PropertyAccess[]>([]);
  const [propertyId, setPropertyIdState] = useState<string | null>(null);

  async function load(activeToken: string) {
    const me = await api<{ data: { profile: Profile; properties: PropertyAccess[] } }>("/api/auth/me", { token: activeToken });
    if (me.data.profile.platform_role !== "hotelier") {
      throw new Error("This portal is for hotelier accounts. Platform operators sign in to the super admin app.");
    }
    setProfile(me.data.profile);
    setProperties(me.data.properties);
    const saved = window.localStorage.getItem("activePropertyId");
    const nextId = me.data.properties.find((item) => item.id === saved)?.id ?? me.data.properties[0]?.id ?? null;
    setPropertyIdState(nextId);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        const sessionToken = data.session?.access_token;
        if (!sessionToken) {
          router.replace("/admin/login");
          return;
        }
        if (!active) return;
        setToken(sessionToken);
        await load(sessionToken);
        if (active) setLoading(false);
      } catch (loadError) {
        if (!active) return;
        setError(errorMessage(loadError));
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  const property = properties.find((item) => item.id === propertyId) ?? null;
  const visibleLinks = useMemo(
    () => links.filter((link) => (property?.page_access?.[link.page] ?? "write") !== "none"),
    [property],
  );

  function setPropertyId(id: string) {
    window.localStorage.setItem("activePropertyId", id);
    setPropertyIdState(id);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner label="Opening your hotel desk" />
      </div>
    );
  }

  if (error || !token || !profile) {
    return (
      <div className="mx-auto grid min-h-screen max-w-lg place-items-center p-6">
        <Banner>{error || "Sign in to continue."}</Banner>
      </div>
    );
  }

  const state: AdminState | null = property
    ? { token, profile, properties, property, setPropertyId, refresh: () => load(token), signOut }
    : null;

  const displayName = profile.full_name || profile.email;

  return (
    <div className="console min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden border-r border-line bg-white lg:flex lg:flex-col">
        <div className="flex items-center gap-3 px-5 py-6">
          <img src="/impact-logo.png" alt="" className="h-10 w-10 rounded-xl bg-[#e7f6ec] object-contain p-1" />
          <div>
            <p className="text-sm font-bold leading-none">Impact Booking</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Hotel desk</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {visibleLinks.map((link) => {
            const Icon = deskIcons[link.href as keyof typeof deskIcons];
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${active ? "bg-[#e7f6ec] font-semibold text-clay" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <Icon />
                {link.label}
              </Link>
            );
          })}
          {property && (
            <Link href={`/h/${property.slug}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
              <IconPortal />
              Booking portal
            </Link>
          )}
        </nav>
        <button className="m-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50" onClick={signOut}>
          <IconLogout />
          Log out
        </button>
      </aside>
      <div className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-4 py-3 lg:border-0 lg:bg-transparent lg:px-8 lg:pt-5">
          <div className="flex items-center gap-2 lg:hidden">
            <img src="/impact-logo.png" alt="" className="h-9 w-9 rounded-xl bg-[#e7f6ec] object-contain p-1" />
            <p className="text-sm font-bold">{property?.name ?? "Hotel desk"}</p>
          </div>
          <div className="hidden text-sm font-semibold lg:block">{property?.name ?? "Set up your hotel"}</div>
          <div className="flex items-center gap-3">
            {properties.length > 1 && property && (
              <select
                className="rounded-xl border border-line bg-white px-3 py-2 text-sm"
                value={property.id}
                onChange={(event) => setPropertyId(event.target.value)}
                aria-label="Active property"
              >
                {properties.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            )}
            <div className="text-right">
              <p className="text-sm font-semibold leading-tight">{displayName}</p>
              <p className="text-xs capitalize text-muted">{property?.role ?? "Hotelier"}</p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-clay text-sm font-semibold text-white">{initials(displayName)}</span>
          </div>
        </header>
        <nav className="flex gap-2 overflow-x-auto border-b border-line bg-white px-3 py-2 lg:hidden">
          {visibleLinks.map((link) => (
            <Link key={link.href} href={link.href} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${pathname === link.href ? "bg-[#e7f6ec] text-clay" : "text-slate-600"}`}>
              {link.label}
            </Link>
          ))}
          {property && (
            <Link href={`/h/${property.slug}`} className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-slate-600">
              Booking portal
            </Link>
          )}
          <button className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-slate-600" onClick={signOut}>
            Log out
          </button>
        </nav>
        <main className="mx-auto max-w-6xl p-4 md:p-8">
          {property && state ? (
            <AdminContext.Provider value={state}>
              {property.status !== "active" && (
                <div className="mb-4">
                  <Banner tone="info">This property is {property.status}. Public booking is paused.</Banner>
                </div>
              )}
              {children}
            </AdminContext.Provider>
          ) : (
            <SetupForm token={token} onCreated={() => load(token)} />
          )}
        </main>
      </div>
    </div>
  );
}

function SetupForm({ token, onCreated }: { token: string; onCreated: () => Promise<void> }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ full_name: "", property_name: "", city: "", country: "", phone: "", currency: "USD", timezone: "UTC" });

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await api("/api/auth/provision", { method: "POST", token, body: form });
      await onCreated();
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto grid max-w-xl gap-4 rounded-2xl border border-line bg-card p-6">
      <div>
        <h1 className="font-serif text-3xl">Create your hotel</h1>
        <p className="mt-2 text-sm text-muted">This starts a 14-day Starter trial. You can take bookings as soon as a room is open.</p>
      </div>
      {error && <Banner>{error}</Banner>}
      <Field label="Your name" required value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} />
      <Field label="Property name" required value={form.property_name} onChange={(event) => setForm({ ...form, property_name: event.target.value })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
        <Field label="Country" value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} />
        <Field label="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        <Field label="Currency" maxLength={3} value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })} />
      </div>
      <Button disabled={pending}>{pending ? "Creating…" : "Create hotel"}</Button>
    </form>
  );
}
