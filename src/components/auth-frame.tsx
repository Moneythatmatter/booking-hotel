export function AuthFrame({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="auth-screen console grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[#146c34] p-12 text-white lg:flex">
        <div className="auth-orb pointer-events-none absolute -left-20 top-16 h-72 w-72 rounded-full bg-[#3dae6a]/45 blur-3xl" />
        <div className="auth-orb pointer-events-none absolute -right-16 bottom-8 h-80 w-80 rounded-full bg-[#0b3d22]/70 blur-3xl [animation-delay:-4s]" />
        <div className="relative flex items-center gap-3">
          <img src="/impact-logo.png" alt="" className="h-12 w-12 rounded-2xl bg-white object-contain p-1.5" />
          <div>
            <p className="text-lg font-semibold leading-none">Impact Booking</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Hotel desk</p>
          </div>
        </div>
        <div className="relative max-w-md">
          <p className="text-4xl font-semibold leading-tight">{title}</p>
          <p className="mt-4 text-base leading-relaxed text-white/80">{subtitle}</p>
        </div>
        <p className="relative text-sm text-white/65">{kicker}</p>
      </section>
      <section className="grid place-items-center bg-[#f4faf6] px-6 py-12">
        <div className="auth-card w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}
