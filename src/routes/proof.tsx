import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AcademyCta } from "@/components/academy-cta";
import { Button } from "@/components/ui/button";
import { getClimbProof, runInternalArena } from "@/lib/climb/server";
import { formatElo } from "@/lib/conquest/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/proof")({ component: ProofPage });

function ProofPage() {
  const proof = useQuery({
    queryKey: ["climb-proof"],
    queryFn: () => getClimbProof(),
    refetchInterval: 20_000,
  });
  const arena = useMutation({ mutationFn: () => runInternalArena() });
  const data = proof.data;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Conquest · proof</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Public proof sheet</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Liorin hunts BOT-titled boards without you. This page is the ledger — live Lichess, not a
          slogan. World’s best is a gate: first among public BOT ratings, with the games still
          posted. Until that gate trips, the claim stays off.
        </p>
      </header>

      {proof.isError ? (
        <p className="text-sm text-danger">Proof fetch failed. {proof.error.message}</p>
      ) : !data ? (
        <div className="h-48 animate-pulse rounded-xl border border-border bg-surface" />
      ) : (
        <>
          <section className="rounded-xl border border-border bg-surface p-6 md:p-8">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Verdict</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-primary">
              {data.worldBestClaim ? "Gate passed." : "Climbing. Not world’s best."}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-fg">{data.verdict}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={data.profile} target="_blank" rel="noreferrer">
                <Button>Open {data.handle} on Lichess</Button>
              </a>
              {data.playingUrl ? (
                <a href={data.playingUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline">Live board</Button>
                </a>
              ) : (
                <Button variant="outline" disabled>
                  Between games
                </Button>
              )}
              <Link to="/engage">
                <Button variant="ghost">Gauntlet</Button>
              </Link>
            </div>
          </section>

          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Blitz", value: data.blitz ? formatElo(data.blitz.rating) : "—" },
              { label: "Public W-D-L", value: `${data.count.win}–${data.count.draw}–${data.count.loss}` },
              { label: "Online BOT rank", value: data.rankAmongOnline ? `#${data.rankAmongOnline}` : "—" },
              { label: "Gap to field lead", value: data.gapToLeader != null ? formatElo(data.gapToLeader) : "—" },
            ].map((row) => (
              <div key={row.label} className="rounded-lg border border-border bg-surface px-4 py-3">
                <dt className="text-[10px] uppercase tracking-[0.16em] text-muted">{row.label}</dt>
                <dd className="mt-1 font-mono text-lg text-primary">{row.value}</dd>
              </div>
            ))}
          </dl>

          <p className="text-xs text-muted">
            {data.title ?? "BOT"} · {data.count.all} rated games · {data.onlineBots} BOTs online
            {data.fieldLeader ? ` · leader ${data.fieldLeader.username} ${formatElo(data.fieldLeader.rating)}` : ""}
            {data.blitz?.prov ? " · rating provisional" : ""} · sheet {new Date(data.fetchedAt).toLocaleTimeString()}
          </p>

          <section>
            <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted">Public games</p>
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
              {data.games.length === 0 ? (
                <li className="px-4 py-3 text-sm text-muted">No rated games on the public sheet yet.</li>
              ) : (
                data.games.map((g) => (
                  <li key={g.id}>
                    <a
                      href={g.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-11 items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-raised"
                    >
                      <span className="truncate">
                        <span
                          className={cn(
                            "mr-2 font-mono text-xs uppercase",
                            g.result === "win" && "text-primary",
                            g.result === "loss" && "text-danger",
                            g.result === "draw" && "text-muted",
                          )}
                        >
                          {g.result}
                        </span>
                        vs {g.opponent}
                        {g.opponentRating ? ` ${g.opponentRating}` : ""} · {g.opening}
                      </span>
                      <span className="shrink-0 text-xs text-muted">{g.status}</span>
                    </a>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="rounded-lg border border-border bg-surface p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Internal dummy arena</p>
            <p className="mt-2 text-sm text-muted">
              Cold vs a 1-ply dummy. This is a health check, not the world-best gate.
            </p>
            <div className="mt-4">
              <Button onClick={() => arena.mutate()} disabled={arena.isPending}>
                {arena.isPending ? "Playing six…" : "Run six internal games"}
              </Button>
            </div>
            {arena.data ? (
              <p className="mt-3 font-mono text-sm text-primary">
                {arena.data.wins}–{arena.data.draws}–{arena.data.losses} · score{" "}
                {arena.data.score.toFixed(2)} · {arena.data.note}
              </p>
            ) : null}
            {arena.isError ? <p className="mt-3 text-sm text-danger">{arena.error.message}</p> : null}
          </section>
        </>
      )}

      <AcademyCta line="The hunt is autonomous. Come back to the academy board — the proof sheet stays public." />
    </div>
  );
}
