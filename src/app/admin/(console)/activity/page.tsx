"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/components/admin-shell";
import { Card, Empty, ListFilters, Modal, Spinner, initials } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/format";

interface DetailRow {
  field: string;
  from: string;
  to: string;
  value: string;
}

interface ActivityDetail {
  kind: "added" | "updated" | "removed";
  title?: string;
  changes: Array<{ field: string; from: string; to: string }>;
  fields: Array<{ field: string; value: string }>;
  rows?: DetailRow[];
}

interface LogRow {
  id: string;
  summary: string;
  created_at: string;
  actor: { full_name: string; email: string } | null;
  detail: ActivityDetail;
}

function dayKey(iso: string) {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const start = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const diff = Math.round((start(today) - start(date)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function actionLabel(summary: string) {
  return summary.split(/[.:]/)[0]?.trim() || summary;
}

function whenLabel(iso: string) {
  return new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function DetailTable({ detail }: { detail?: ActivityDetail }) {
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

function activityType(log: LogRow) {
  if (log.detail?.kind === "updated") return "Update";
  if (/^Cancelled/.test(log.summary)) return "Cancel";
  if (log.detail?.kind === "removed") return "Delete";
  return "Create";
}

function tone(type: string) {
  if (type === "Create") return "bg-[#e7f6ec] text-[#16803c]";
  if (type === "Delete" || type === "Cancel") return "bg-red-50 text-red-700";
  return "bg-amber-50 text-amber-700";
}

export default function ActivityPage() {
  const { token, property } = useAdmin();
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [open, setOpen] = useState<LogRow | null>(null);
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ data: { logs: LogRow[] } }>(`/api/hotelier/properties/${property.id}/activity`, { token })
      .then((result) => setLogs(result.data.logs))
      .catch((loadError) => setError(errorMessage(loadError)))
      .finally(() => setLoading(false));
  }, [token, property.id]);

  const shown = logs.filter((log) => {
    const actor = log.actor?.full_name || log.actor?.email || "";
    const type = activityType(log);
    if (status && type !== status) return false;
    if (q && !`${actor} ${log.summary} ${type}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const groups: Array<{ label: string; items: LogRow[] }> = [];
  for (const log of shown) {
    const key = dayKey(log.created_at);
    const current = groups[groups.length - 1];
    if (current && dayKey(current.items[0].created_at) === key) current.items.push(log);
    else groups.push({ label: dayLabel(log.created_at), items: [log] });
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity</h1>
          <p className="mt-1 text-sm text-muted">What was added or changed at {property.name} during the last year.</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#16803c] shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          {shown.length} {shown.length === 1 ? "event" : "events"}
        </span>
      </div>
      <ListFilters
        query={draft}
        onQueryChange={setDraft}
        onSearch={() => setQ(draft.trim())}
        placeholder="Search person or change"
        status={status}
        onStatusChange={setStatus}
        statusLabel="Type"
        statuses={[
          { value: "Create", label: "Create" },
          { value: "Update", label: "Update" },
          { value: "Delete", label: "Delete" },
          { value: "Cancel", label: "Cancel" },
        ]}
      />
      {error && <p className="text-sm text-red-800">{error}</p>}
      {loading ? (
        <Spinner label="Loading activity" />
      ) : shown.length === 0 ? (
        <Empty title="No activity yet" body={q || status ? "Nothing matches this search." : "Property, room, booking, and user changes from the last 12 months show up here."} />
      ) : (
        <div className="grid gap-5">
          {groups.map((group) => (
            <Card key={group.label}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#16803c]">{group.label}</p>
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-left text-sm">
                  <thead>
                    <tr>
                      <th className="w-[34%]">Type</th>
                      <th className="w-[42%]">Who</th>
                      <th className="w-[24%]">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((log) => {
                      const actor = log.actor?.full_name || log.actor?.email || "System";
                      const type = activityType(log);
                      return (
                        <tr key={log.id} className="cursor-pointer" onClick={() => setOpen(log)}>
                          <td>
                            <span className="flex items-center gap-3 whitespace-nowrap">
                              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-bold ${tone(type)}`}>{type.slice(0, 1)}</span>
                              <span className="font-semibold">{type}</span>
                            </span>
                          </td>
                          <td>
                            <span className="inline-flex items-center gap-2">
                              <span className="grid h-5 w-5 place-items-center rounded-full bg-[#e7f6ec] text-[10px] font-bold text-[#16803c]">{initials(actor)}</span>
                              {actor}
                            </span>
                          </td>
                          <td>
                            <time dateTime={log.created_at}>{new Date(log.created_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</time>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal large open={Boolean(open)} title={open ? activityType(open) : "Activity"} onClose={() => setOpen(null)}>
        {open && (
          <div className="grid gap-4">
            <p className="text-base font-semibold">{open.detail?.title || actionLabel(open.summary)}</p>
            <dl className="grid grid-cols-[5.5rem_1fr] gap-y-2 text-sm">
              <dt className="text-muted">When</dt>
              <dd>{dayLabel(open.created_at)} · {whenLabel(open.created_at)}</dd>
              <dt className="text-muted">Who</dt>
              <dd>{open.actor?.full_name || "System"}{open.actor?.email ? ` · ${open.actor.email}` : ""}</dd>
            </dl>
            <DetailTable detail={open.detail} />
          </div>
        )}
      </Modal>
    </div>
  );
}
