import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useWing } from "@/components/wing-context";
import { cn } from "@/lib/utils";
import { WINGS, type WingId } from "@/lib/wings";

const ERA_ORDER: WingId[] = ["academy", "conquest", "combined", "bit"];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { wing, setWing } = useWing();
  const [open, setOpen] = useState(false);
  const gate = wing === "gate";
  const meta = gate ? null : WINGS[wing];
  const nav = meta?.nav ?? [];
  const kicker = meta ? `${meta.product} // ${meta.era}` : "LIORIN // choose a wing";
  const tagline = meta ? meta.tagline : "Old. New. Combined. 8-bit.";
  const home = meta?.home ?? "/";
  const footerLead = meta ? `${meta.product} — ${meta.tagline}` : "LIORIN — four wings, one engine.";

  return (
    <div className={cn("crt-frame min-h-dvh bg-bg text-fg", wing === "bit" && "theme-bit")}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-fg"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="min-w-0" onClick={() => setOpen(false)}>
            <p className="text-[10px] uppercase tracking-[0.28em] text-muted">
              {kicker}
            </p>
            <p className="truncate text-sm font-semibold tracking-[0.12em] text-primary">
              {tagline}
            </p>
          </Link>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-sm border border-border text-fg md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          {!gate ? (
            <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
              {nav.map((item) => {
                const active =
                  item.to === home
                    ? pathname === item.to
                    : pathname === item.to || pathname.startsWith(`${item.to}/`);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "inline-flex h-11 items-center px-2.5 text-[11px] uppercase tracking-[0.14em]",
                      active ? "text-primary" : "text-muted hover:text-fg",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          ) : null}
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-6xl items-stretch" role="tablist" aria-label="Wings">
            {ERA_ORDER.map((id) => {
              const w = WINGS[id];
              const active = wing === id;
              return (
                <Link
                  key={id}
                  to={w.home}
                  onClick={() => {
                    setWing(id);
                    setOpen(false);
                  }}
                  role="tab"
                  aria-selected={active}
                  className={cn(
                    "flex h-11 flex-1 items-center justify-center text-[10px] uppercase tracking-[0.12em] md:text-[11px] md:tracking-[0.16em]",
                    active ? "bg-raised text-primary" : "text-muted hover:text-fg",
                  )}
                >
                  {w.era}
                </Link>
              );
            })}
          </div>
        </div>
        {open && !gate ? (
          <nav className="border-t border-border px-4 py-2 md:hidden" aria-label="Mobile">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex h-11 items-center text-sm uppercase tracking-[0.14em] text-fg"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
        {!gate ? (
          <nav
            className="hidden border-t border-border px-4 py-1 md:flex lg:hidden"
            aria-label="Tablet"
          >
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="inline-flex h-11 items-center px-2 text-[11px] uppercase tracking-[0.12em] text-muted hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl px-4 py-6 md:py-8">
        {children}
      </main>
      <footer className="border-t border-border px-4 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 text-[11px] uppercase tracking-[0.14em] text-muted">
          <p className="text-fg">
            {footerLead}
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-2">
            <Link to="/" className="text-primary">
              Wings
            </Link>
            <Link to="/academy" className="text-primary">
              Academy
            </Link>
            <Link to="/conquest" className="text-primary">
              Conquest
            </Link>
            <Link to="/combined" className="text-primary">
              Combined
            </Link>
            <Link to="/bit" className="text-primary">
              8-Bit
            </Link>
            {!gate
              ? nav.slice(1).map((item) => (
                  <Link key={item.to} to={item.to} className="text-primary">
                    {item.label}
                  </Link>
                ))
              : null}
          </p>
          <p>Fair-play charter: engines vs bots only · Youth-safe academy boards remain</p>
          <p>
            Public APIs: Lichess Bot, Lichess FIDE, Chess.com leaderboards. Liorin is not affiliated
            with Lichess, Chess.com, FIDE, or TCEC.
          </p>
        </div>
      </footer>
    </div>
  );
}
