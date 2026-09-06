import { createFileRoute, Link } from "@tanstack/react-router";
import { AcademyStrip } from "@/components/academy-strip";
import { Button } from "@/components/ui/button";
import { WingNote } from "@/components/wing-note";

export const Route = createFileRoute("/academy")({ component: AcademyPage });

function AcademyPage() {
  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-xl border border-border bg-surface p-6 md:p-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">OLD · LIORIN Chess Academy</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-fg md:text-5xl">
          I am Liorin.
          <span className="block text-primary">Teach. Then hold.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
          The original academy. Lessons when you want them. Cold when you do not — the engine does
          not yield. Watch the 2700 Club. Keep every finished game for recap. The agent war room is
          a different wing.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/play">
            <Button>Play cold</Button>
          </Link>
          <Link to="/learn">
            <Button variant="outline">Lessons</Button>
          </Link>
          <Link to="/ratings">
            <Button variant="ghost">2700 Club</Button>
          </Link>
        </div>
      </section>

      <AcademyStrip />
      <WingNote wing="academy" />
    </div>
  );
}
