import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const fieldClass =
  "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-clay focus:ring-2 focus:ring-clay/20";

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-clay text-white hover:bg-clay/90",
    ghost: "border border-line bg-white text-ink hover:bg-cream",
    danger: "bg-red-800 text-white hover:bg-red-900",
  }[variant];
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium">{label}</span>
      <input className={fieldClass} {...props} />
    </label>
  );
}

export function Select({ label, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium">{label}</span>
      <select className={fieldClass} {...props}>
        {children}
      </select>
    </label>
  );
}

export function TextArea({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium">{label}</span>
      <textarea className={`${fieldClass} min-h-28`} {...props} />
    </label>
  );
}

export function Banner({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "ok" | "info" }) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-900",
    ok: "border-lime-200 bg-lime-50 text-moss",
    info: "border-amber-200 bg-amber-50 text-amber-950",
  }[tone];
  return <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>{children}</div>;
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-card px-6 py-12 text-center">
      <p className="font-serif text-2xl">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{body}</p>
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-clay" />
      {label}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "bad" | "warn" }) {
  const styles = {
    neutral: "bg-cream text-ink",
    good: "bg-lime-100 text-moss",
    bad: "bg-red-100 text-red-900",
    warn: "bg-amber-100 text-amber-950",
  }[tone];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}>{children}</span>;
}

export function statusTone(status: string): "neutral" | "good" | "bad" | "warn" {
  if (["active", "confirmed", "paid", "checked_in", "trialing"].includes(status)) return "good";
  if (["blocked", "cancelled", "failed", "expired", "no_show"].includes(status)) return "bad";
  if (["suspended", "pending", "past_due", "maintenance"].includes(status)) return "warn";
  return "neutral";
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`data-card rounded-2xl border border-line bg-card p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] ${className}`}>{children}</section>;
}

export function Modal({ open, title, onClose, children, large = false }: { open: boolean; title: string; onClose: () => void; children: ReactNode; large?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 top-0 z-40 lg:left-[248px]">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`sheet-up absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl ${large ? "min-h-[60vh]" : ""}`}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line" />
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" className="grid h-8 w-8 place-items-center rounded-lg text-xl leading-none text-muted hover:bg-cream" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function initials(value: string) {
  const parts = value.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
  return letters || "U";
}
