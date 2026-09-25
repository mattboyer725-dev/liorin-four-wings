import { createFileRoute, Link } from "@tanstack/react-router";
import { useWing } from "@/components/wing-context";
import { Button } from "@/components/ui/button";
import { WINGS, type WingId } from "@/lib/wings";

export const Route = createFileRoute("/")({ component: WingsPage });

const ORDER: WingId[] = ["academy", "conquest", "combined", "bit"];

function WingsPage() {
  const { lastWing, setWing } = useWing();
  const resume = lastWing ? WINGS[lastWing] : null;

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-xl border border-border bg-surface p-6 md:p-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">LIORIN · four wings</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-fg md:text-5xl">
          Old. New. Combined. 8-bit.
          <span className="block text-primary">Pick a floor. Keep the others intact.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
          Academy is the original teaching product. Conquest is the new agent command floor.
          Combined is both on one nav. 8-bit is the NES cart — pixel board, own engine skin,
          separate from the CRT floors.
        </p>
        {resume ? (
          <div className="mt-6">
            <Link to={resume.home} onClick={() => setWing(resume.id)}>
              <Button variant="outline">Resume {resume.era} · {resume.name}</Button>
            </Link>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ORDER.map((id) => {
          const wing = WINGS[id];
          return (
            <Link
              key={id}
              to={wing.home}
              onClick={() => setWing(id)}
              className="group flex flex-col rounded-xl border border-border bg-surface p-6 transition-colors duration-200 hover:border-primary"
            >
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted">{wing.era}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-fg group-hover:text-primary">
                {wing.name}
              </h2>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-primary">{wing.tagline}</p>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">{wing.blurb}</p>
              <p className="mt-6 text-xs uppercase tracking-[0.14em] text-primary">Enter {wing.name}</p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
