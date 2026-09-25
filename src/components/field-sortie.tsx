import { useMutation } from "@tanstack/react-query";
import { Chess, type Square } from "chess.js";
import { useEffect, useMemo, useState } from "react";
import { ChessBoard } from "@/components/chess-board";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fieldTick } from "@/lib/conquest/server";
import { LICHESS_TOKEN_STORAGE_KEY } from "@/lib/platforms/identity";

type Tick = Extract<Awaited<ReturnType<typeof fieldTick>>, { ok: true }>;

function lastSquares(uci: string | null): { from: Square; to: Square } | null {
  if (!uci || uci.length < 4) return null;
  return { from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square };
}

export function FieldSortie() {
  const [armed, setArmed] = useState(false);
  const [note, setNote] = useState("Arm a sortie after the BOT upgrade. Diplomat still refuses human titles.");
  const [tick, setTick] = useState<Tick | null>(null);

  const run = useMutation({
    mutationFn: async () => {
      const token = sessionStorage.getItem(LICHESS_TOKEN_STORAGE_KEY) ?? "";
      if (!token) throw new Error("Bind a Lichess BOT token on Platforms first.");
      return fieldTick({ data: { token } });
    },
    onSuccess: (res) => {
      if (!res.ok) {
        setNote(res.error);
        return;
      }
      setTick(res);
      if (res.games.some((g) => g.played)) {
        setNote(`Moved: ${res.games.filter((g) => g.played).map((g) => `${g.opponent} ${g.played}`).join(" · ")}`);
      } else if (res.accepted.length) {
        setNote(`Accepted BOT ${res.accepted.join(", ")}.`);
      } else if (res.declined.length) {
        setNote(`Diplomat declined ${res.declined.join(", ")}.`);
      } else if (res.idle) {
        setNote("Sortie armed. No live BOT game. Challenge from the hunt.");
      } else {
        setNote(`Waiting on ${res.games.map((g) => g.opponent).join(", ") || "the board"}.`);
      }
    },
    onError: (e) => setNote(e.message),
  });

  useEffect(() => {
    if (!armed) return;
    const fire = () => run.mutate();
    fire();
    const id = window.setInterval(fire, 2800);
    return () => window.clearInterval(id);
  }, [armed, run.mutate]);

  const live = tick?.games[0];
  const chess = useMemo(() => {
    try {
      return live?.fen ? new Chess(live.fen) : new Chess();
    } catch {
      return new Chess();
    }
  }, [live?.fen]);

  return (
    <section className="rounded-lg border border-border bg-surface p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Captain · field sortie</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-fg">Play the public BOT board</h2>
        </div>
        <Button
          variant={armed ? "outline" : "primary"}
          onClick={() => setArmed((v) => !v)}
          aria-pressed={armed}
        >
          {armed ? "Stand down" : "Arm sortie"}
        </Button>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Cold engine, BOT titles only. Incoming humans are declined. Finished games land in the academy
        archive. Chat promotes the academy once per game.
      </p>
      <p className="mt-3 text-xs leading-relaxed text-fg">{note}</p>
      {live ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
          <ChessBoard
            chess={chess}
            selected={null}
            onSelect={() => {}}
            lastMove={lastSquares(live.lastMove)}
            orientation={live.color === "black" ? "b" : "w"}
            disabled
          />
          <div className="flex flex-col gap-2">
            <p className="text-sm text-fg">
              vs {live.opponent} · {live.rated ? "rated" : "casual"} · {live.color}
            </p>
            {live.played ? <p className="text-sm text-primary">{live.played}</p> : null}
            {live.aborted ? <Badge className="w-fit text-danger">Aborted · {live.aborted}</Badge> : null}
            <a
              href={`https://lichess.org/${live.gameId}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs uppercase tracking-[0.14em] text-primary"
            >
              Open on Lichess
            </a>
          </div>
        </div>
      ) : null}
    </section>
  );
}
