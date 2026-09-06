import { Link } from "@tanstack/react-router";
import type { WingId } from "@/lib/wings";
import { WINGS } from "@/lib/wings";

const COPY: Record<WingId, { line: string; links: { to: "/academy" | "/conquest" | "/combined" | "/bit" | "/"; label: string }[] }> =
  {
    academy: {
      line: "You are in the old wing. The agent team lives in Conquest. The NES cart is 8-Bit.",
      links: [
        { to: "/conquest", label: "Open Conquest (new)" },
        { to: "/bit", label: "Open 8-Bit" },
        { to: "/", label: "All wings" },
      ],
    },
    conquest: {
      line: "You are in the new wing. The teaching board lives in Academy. The NES cart is 8-Bit.",
      links: [
        { to: "/academy", label: "Open Academy (old)" },
        { to: "/bit", label: "Open 8-Bit" },
        { to: "/", label: "All wings" },
      ],
    },
    combined: {
      line: "You are on the combined floor. Old academy and new conquest share this nav. 8-Bit stays its own cart.",
      links: [
        { to: "/academy", label: "Academy only" },
        { to: "/bit", label: "8-Bit cart" },
        { to: "/", label: "All wings" },
      ],
    },
    bit: {
      line: "You are on the NES cart. Pixel board, cold engine, stages. Academy and Conquest stay on the CRT floors.",
      links: [
        { to: "/academy", label: "Academy (old)" },
        { to: "/conquest", label: "Conquest (new)" },
        { to: "/", label: "All wings" },
      ],
    },
  };

export function WingNote({ wing }: { wing: WingId }) {
  const copy = COPY[wing];
  const meta = WINGS[wing];
  return (
    <aside className="rounded-lg border border-border-strong bg-raised p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
        {meta.era} · {meta.product}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-fg">{copy.line}</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {copy.links.map((l) => (
          <Link key={l.to} to={l.to} className="text-xs uppercase tracking-[0.14em] text-primary">
            {l.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
