import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LESSONS } from "@/lib/chess/lessons";
import { displayName, formatRating } from "@/lib/fide/format";
import { getLiveEvents, getLiveRegister } from "@/lib/fide/server";
import { getAcademySummary } from "@/lib/games/server";

export function AcademyStrip({ compact }: { compact?: boolean }) {
  const summary = useQuery({ queryKey: ["archive"], queryFn: () => getAcademySummary() });
  const register = useQuery({ queryKey: ["register"], queryFn: () => getLiveRegister() });
  const events = useQuery({ queryKey: ["events"], queryFn: () => getLiveEvents() });

  const club = (register.data?.players ?? [])
    .filter((p) => p.club)
    .sort((a, b) => (b.standard ?? 0) - (a.standard ?? 0))
    .slice(0, compact ? 4 : 6);
  const live = events.data?.active.slice(0, compact ? 2 : 4) ?? [];
  const counts = summary.data;

  return (
    <div className="flex flex-col gap-8">
      {counts ? (
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Games kept", value: String(counts.games) },
            { label: "Liorin W-D-L", value: `${counts.wins}–${counts.draws}–${counts.losses}` },
            { label: "Cold games", value: String(counts.coldGames) },
            { label: "2700 Club", value: String(register.data?.clubCount ?? "—") },
          ].map((it) => (
            <div key={it.label} className="rounded-md border border-border bg-bg px-3 py-3">
              <dt className="text-[10px] uppercase tracking-[0.16em] text-muted">{it.label}</dt>
              <dd className="mt-1 truncate tabular text-lg text-primary">{it.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-md border border-border bg-surface" />
          ))}
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm uppercase tracking-[0.16em] text-muted">Lessons</h2>
          <Link to="/learn" className="text-xs uppercase tracking-[0.14em] text-primary">
            All lessons
          </Link>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {LESSONS.slice(0, compact ? 2 : 4).map((lesson) => (
            <li key={lesson.id} className="flex flex-col rounded-lg border border-border bg-surface p-5">
              <h3 className="text-base font-medium text-fg">{lesson.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{lesson.brief}</p>
              <Link to="/play" search={{ lesson: lesson.id }} className="mt-4">
                <Button variant="outline" className="w-full">
                  Open on the board
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-[0.16em] text-muted">2700 Club</h2>
            <Link to="/ratings" className="text-xs uppercase tracking-[0.14em] text-primary">
              Full register
            </Link>
          </div>
          <ol className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {club.length === 0
              ? Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className="h-12 animate-pulse bg-surface" />
                ))
              : club.map((p, i) => (
                  <li key={p.id}>
                    <Link
                      to="/ratings/$fideId"
                      params={{ fideId: String(p.id) }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-raised"
                    >
                      <span className="w-6 tabular text-xs text-muted">{i + 1}</span>
                      <span className="flex-1 truncate text-sm text-fg">{displayName(p.name)}</span>
                      {p.title ? <Badge>{p.title}</Badge> : null}
                      <span className="tabular text-sm text-primary">{formatRating(p.standard)}</span>
                    </Link>
                  </li>
                ))}
          </ol>
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-[0.16em] text-muted">Live events</h2>
            <Link to="/events" className="text-xs uppercase tracking-[0.14em] text-primary">
              Broadcasts
            </Link>
          </div>
          {live.length === 0 ? (
            <p className="rounded-lg border border-border bg-surface px-4 py-8 text-sm text-muted">
              No live broadcast flagged right now.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {live.map((ev) => (
                <li key={ev.id}>
                  <a
                    href={ev.roundUrl ?? ev.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col rounded-lg border border-border bg-surface p-4 hover:border-primary"
                  >
                    <p className="text-sm font-medium text-fg">{ev.name}</p>
                    <p className="mt-1 text-xs text-muted">{ev.roundName ?? ev.format ?? "Round not posted"}</p>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
