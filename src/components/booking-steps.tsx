const STEPS = ["Dates", "Rooms", "Extras", "Details", "Confirm"];

export function BookingSteps({ current }: { current: number }) {
  return (
    <ol className="mx-auto mt-8 grid max-w-2xl grid-cols-5 border-b border-slate-100 pb-6">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const active = step === current;
        const done = step < current;
        return (
          <li key={label} className="relative text-center">
            {index > 0 && <span className={`absolute right-1/2 top-4 left-0 h-px ${done || active ? "bg-orange-200" : "bg-slate-200"}`} />}
            <span
              className={`relative z-10 mx-auto grid h-8 w-8 place-items-center rounded-full text-sm font-semibold ${
                active ? "bg-[#f08a2a] text-white" : done ? "bg-[#f8d7b0] text-[#9a5410]" : "bg-slate-100 text-slate-400"
              }`}
            >
              {done ? "✓" : step}
            </span>
            <span className={`mt-2 block text-[11px] font-semibold tracking-[0.14em] ${active ? "text-slate-900" : "text-slate-300"}`}>{label.toUpperCase()}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function portalButtonColor(color?: string) {
  return color && color !== "#9a3412" ? color : "#f6b07a";
}
