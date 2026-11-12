"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconCalendar, IconChart, IconUsers } from "@/components/desk-icons";
import { Badge, Card, Modal, Spinner, initials, statusTone } from "@/components/ui";
import { useAdmin } from "@/components/admin-shell";
import { api } from "@/lib/api";
import { errorMessage, money } from "@/lib/format";

interface Dashboard {
  stats: {
    arrivals_today: number;
    departures_today: number;
    in_house: number;
    upcoming: number;
    month_revenue: number;
    occupancy_today: number;
    open_bookings: number;
  };
  recent_activity: Array<{
    id: string;
    summary: string;
    created_at: string;
    actor: { full_name: string; email: string } | null;
    detail?: {
      kind: "added" | "updated" | "removed";
      title?: string;
      rows?: Array<{ field: string; from: string; to: string; value: string }>;
    };
  }>;
  recent_bookings: Array<{
    id: string;
    confirmation_code: string;
    guest_name: string;
    check_in: string;
    check_out: string;
    status: string;
    total_amount: number;
    currency: string;
    category: { name: string } | null;
  }>;
}

type ActivityItem = Dashboard["recent_activity"][number];

function activityType(item: ActivityItem) {
  if (item.detail?.kind === "updated") return "Update";
  if (/^Cancelled/.test(item.summary)) return "Cancel";
  if (item.detail?.kind === "removed") return "Delete";
  return "Create";
}

function activityTone(type: string) {
  if (type === "Create") return "bg-[#e7f6ec] text-[#16803c]";
  if (type === "Delete" || type === "Cancel") return "bg-red-50 text-red-700";
  return "bg-amber-50 text-amber-700";
}

export default function DashboardPage() {
  const { token, property } = useAdmin();
  const [data, setData] = useState<Dashboard | null>(null);
  const [open, setOpen] = useState<ActivityItem | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ data: Dashboard }>(`/api/hotelier/properties/${property.id}/dashboard`, { token })
      .then((result) => setData(result.data))
      .catch((loadError) => setError(errorMessage(loadError)));
  }, [token, property.id]);

  if (error) return <p className="text-sm text-red-800">{error}</p>;
  if (!data) return <Spinner label="Loading the desk" />;

  const cards = [
    ["Arrivals today", data.stats.arrivals_today],
    ["Departures", data.stats.departures_today],
    ["In house", data.stats.in_house],
    ["Upcoming", data.stats.upcoming],
    ["Occupancy", `${data.stats.occupancy_today}%`],
    ["Month volume", money(data.stats.month_revenue, property.currency)],
  ];

  const occupancy = Math.max(0, Math.min(100, data.stats.occupancy_today));
  const bars = [
    ["Arrivals", data.stats.arrivals_today],
    ["Departures", data.stats.departures_today],
    ["In house", data.stats.in_house],
    ["Upcoming", data.stats.upcoming],
  ] as const;
  const maxBar = Math.max(...bars.map(([, value]) => value), 1);

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard overview</h1>
          <p className="mt-1 text-sm text-muted">{data.stats.open_bookings} open bookings at {property.name}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Live
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.slice(0, 4).map(([label, value], index) => {
          const tones = ["bg-emerald-100 text-emerald-700", "bg-emerald-100 text-emerald-600", "bg-amber-100 text-amber-600", "bg-emerald-50 text-emerald-800"];
          const icons = [<IconCalendar key="a" />, <IconCalendar key="d" />, <IconUsers key="h" />, <IconChart key="u" />];
          return (
            <article key={String(label)} className="rounded-2xl border border-line bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</p>
                <span className={`grid h-9 w-9 place-items-center rounded-xl ${tones[index]}`}>{icons[index]}</span>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight">{value}</p>
            </article>
          );
        })}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <h2 className="text-base font-semibold">Today</h2>
          <p className="text-sm text-muted">Arrivals, departures, and upcoming stays</p>
          <div className="mt-6 grid h-48 grid-cols-4 items-end gap-4">
            {bars.map(([label, value]) => (
              <div key={label} className="flex h-full flex-col justify-end gap-2">
                <div className="rounded-t-xl bg-[#16803c]" style={{ height: `${Math.max(8, (value / maxBar) * 100)}%` }} />
                <p className="text-center text-xs text-muted">{label}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold">Occupancy</h2>
          <p className="text-sm text-muted">Rooms filled tonight</p>
          <div className="mt-6 flex items-center gap-5">
            <div
              className="grid h-32 w-32 place-items-center rounded-full"
              style={{ background: `conic-gradient(#16803c ${occupancy * 3.6}deg, #e7f6ec 0deg)` }}
            >
              <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-xl font-bold">{occupancy}%</div>
            </div>
            <div className="text-sm text-muted">
              <p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#16803c]" />Occupied ({occupancy}%)</p>
              <p className="mt-2"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#e7f6ec]" />Open ({100 - occupancy}%)</p>
            </div>
          </div>
        </Card>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.slice(4).map(([label, value]) => (
          <article key={String(label)} className="rounded-2xl border border-line bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
          </article>
        ))}
      </div>
      <Card>
        <h2 className="text-base font-semibold">Recent bookings</h2>
        {data.recent_bookings.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No reservations yet. Share the booking page once a room is open.</p>
        ) : (
          <ul className="mt-2">
            {data.recent_bookings.map((booking) => (
              <li key={booking.id} className="flex items-center gap-3 border-t border-line py-3 first:border-0">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-clay text-xs font-semibold text-white">{initials(booking.guest_name)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{booking.guest_name}</span>
                  <span className="block truncate text-xs text-muted">
                    {booking.confirmation_code} · {booking.check_in} → {booking.check_out}
                  </span>
                </span>
                <Badge tone={statusTone(booking.status)}>{booking.status.replaceAll("_", " ")}</Badge>
                <span className="hidden text-sm font-medium sm:block">{money(booking.total_amount, booking.currency)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Recent activity</h2>
            <p className="text-sm text-muted">Changes and additions from the last year</p>
          </div>
          <Link href="/admin/activity" className="text-sm font-semibold text-[#16803c]">
            View all
          </Link>
        </div>
        {(data.recent_activity ?? []).length === 0 ? (
          <p className="mt-4 text-sm text-muted">No activity recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left text-sm">
              <thead>
                <tr>
                  <th className="w-[34%]">Type</th>
                  <th className="w-[40%]">Who</th>
                  <th className="w-[26%]">Time</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_activity.map((item) => {
                  const actor = item.actor?.full_name || item.actor?.email || "System";
                  const type = activityType(item);
                  return (
                    <tr key={item.id} className="cursor-pointer" onClick={() => setOpen(item)}>
                      <td>
                        <span className="flex items-center gap-3 whitespace-nowrap">
                          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-bold ${activityTone(type)}`}>{type.slice(0, 1)}</span>
                          <span className="font-semibold">{type}</span>
                        </span>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-2 whitespace-nowrap">
                          <span className="grid h-5 w-5 place-items-center rounded-full bg-[#e7f6ec] text-[10px] font-bold text-[#16803c]">{initials(actor)}</span>
                          <span className="truncate">{actor}</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap">
                        <time dateTime={item.created_at}>
                          {new Date(item.created_at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                        </time>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Modal large open={Boolean(open)} title={open ? activityType(open) : "Activity"} onClose={() => setOpen(null)}>
        {open && (
          <div className="grid gap-4">
            <p className="text-base font-semibold">{open.detail?.title || open.summary.split(/[.:]/)[0]}</p>
            <dl className="grid grid-cols-[5.5rem_1fr] gap-y-2 text-sm">
              <dt className="text-muted">When</dt>
              <dd>{new Date(open.created_at).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</dd>
              <dt className="text-muted">Who</dt>
              <dd>
                {open.actor?.full_name || "System"}
                {open.actor?.email ? ` · ${open.actor.email}` : ""}
              </dd>
            </dl>
            <ActivityRows detail={open.detail} />
          </div>
        )}
      </Modal>
    </div>
  );
}

function ActivityRows({ detail }: { detail?: ActivityItem["detail"] }) {
  const rows = detail?.rows ?? [];
  if (!detail || rows.length === 0) return <p className="text-sm text-muted">No field detail was stored for this event.</p>;
  const compared = detail.kind === "updated";
  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full whitespace-nowrap text-left text-sm">
        <thead>
          <tr className="bg-[#16803c] text-white">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">Field</th>
            {compared ? (
              <>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">Previous</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">New</th>
              </>
            ) : (
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">Value</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const changed = compared && row.from !== row.to;
            return (
              <tr key={row.field} className="border-t border-line">
                <td className="px-4 py-3 font-medium">{row.field}</td>
                {compared ? (
                  <>
                    <td className={`px-4 py-3 ${changed ? "text-slate-500" : ""}`}>{row.from}</td>
                    <td className={`px-4 py-3 ${changed ? "font-semibold text-[#16803c]" : ""}`}>{row.to}</td>
                  </>
                ) : (
                  <td className="px-4 py-3 font-medium">{row.value}</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
