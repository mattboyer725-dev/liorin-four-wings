import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Chess, type PieceSymbol, type Square } from "chess.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PixelBoard } from "@/components/pixel-board";
import { Button } from "@/components/ui/button";
import { chimeCapture, chimeCheck, chimeMate, chimeMove, chimeStart, unlockChime } from "@/lib/chess/chime";
import { chooseMove } from "@/lib/chess/engine";
import { LESSONS } from "@/lib/chess/lessons";
import { boardFrom, liorinResult, makePgn, openingName, START_FEN } from "@/lib/chess/pgn";
import { saveAcademyGame } from "@/lib/games/server";
import type { SaveGameInput } from "@/lib/games/types";
import { cn } from "@/lib/utils";

type Screen = "title" | "stages" | "play";
type Search = { stage?: string };

export const Route = createFileRoute("/bit")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    stage: typeof s.stage === "string" ? s.stage : undefined,
  }),
  component: BitPage,
});

function BitPage() {
  const { stage: stageId } = Route.useSearch();
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>(stageId ? "play" : "title");
  const [activeStage, setActiveStage] = useState<string | undefined>(stageId);

  useEffect(() => {
    if (!stageId) return;
    setActiveStage(stageId);
    setScreen("play");
  }, [stageId]);

  return (
    <div className="flex flex-col gap-6">
      {screen === "title" ? (
        <TitleScreen
          onStart={() => {
            unlockChime();
            chimeStart();
            setActiveStage(undefined);
            void navigate({ to: "/bit", search: {} });
            setScreen("play");
          }}
          onStages={() => {
            unlockChime();
            setScreen("stages");
          }}
        />
      ) : screen === "stages" ? (
        <StageSelect
          onPick={(id) => {
            unlockChime();
            chimeStart();
            setActiveStage(id);
            setScreen("play");
          }}
          onBack={() => setScreen("title")}
        />
      ) : (
        <BitPlay
          lessonId={activeStage}
          onTitle={() => {
            setActiveStage(undefined);
            void navigate({ to: "/bit", search: {} });
            setScreen("title");
          }}
          onStages={() => setScreen("stages")}
        />
      )}
    </div>
  );
}

function TitleScreen({ onStart, onStages }: { onStart: () => void; onStages: () => void }) {
  return (
    <section className="flex min-h-[70dvh] flex-col items-center justify-center gap-8 border-4 border-primary bg-surface px-4 py-12 text-center">
      <p className="text-[10px] leading-relaxed text-muted">LIORIN CHESS ACADEMY PRESENTS</p>
      <h1 className="text-3xl leading-tight text-primary md:text-5xl">
        LIORIN
        <span className="mt-3 block text-fg">8-BIT</span>
      </h1>
      <p className="max-w-sm text-[10px] leading-6 text-muted">
        THE ORIGINAL CART. PIXEL BOARD. COLD ENGINE. STAGES ARE LESSONS. LIORIN DOES NOT YIELD.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="bit-blink h-12 px-4 text-sm text-primary"
      >
        PRESS START
      </button>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={onStart}>VS LIORIN</Button>
        <Button variant="outline" onClick={onStages}>
          STAGES
        </Button>
      </div>
      <p className="text-[10px] text-muted">© 2026 ACADEMY · 1 PLAYER</p>
    </section>
  );
}

function StageSelect({ onPick, onBack }: { onPick: (id: string) => void; onBack: () => void }) {
  return (
    <section className="flex flex-col gap-6 border-4 border-primary bg-surface p-5">
      <header>
        <p className="text-[10px] text-muted">SELECT STAGE</p>
        <h1 className="mt-2 text-xl text-primary">WORLD 1</h1>
      </header>
      <ul className="flex flex-col gap-2">
        {LESSONS.map((lesson, i) => (
          <li key={lesson.id}>
            <Link
              to="/bit"
              search={{ stage: lesson.id }}
              onClick={() => onPick(lesson.id)}
              className="flex min-h-11 items-center justify-between gap-3 border-2 border-border px-3 py-3 hover:border-primary"
            >
              <span className="text-[10px] text-primary">1-{i + 1}</span>
              <span className="flex-1 text-left text-[11px] leading-5 text-fg">{lesson.title.toUpperCase()}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Button variant="ghost" onClick={onBack}>
        TITLE
      </Button>
    </section>
  );
}

function BitPlay({
  lessonId,
  onTitle,
  onStages,
}: {
  lessonId?: string;
  onTitle: () => void;
  onStages: () => void;
}) {
  const lesson = LESSONS.find((l) => l.id === lessonId);
  const initialFen = lesson?.fen ?? START_FEN;
  const [startFen, setStartFen] = useState(initialFen);
  const [sans, setSans] = useState<string[]>([]);
  const [selected, setSelected] = useState<Square | null>(null);
  const [orient, setOrient] = useState<"w" | "b">(lesson && lesson.fen.includes(" b ") ? "b" : "w");
  const [pendingPromo, setPendingPromo] = useState<{ from: Square; to: Square } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const saved = useRef(false);
  const profile = lesson ? "balanced" : "cold";

  const chess = useMemo(() => boardFrom(startFen, sans), [startFen, sans]);
  const over = chess.isGameOver();
  const status = over
    ? chess.isCheckmate()
      ? "CHECKMATE"
      : "DRAW"
    : chess.inCheck()
      ? "CHECK"
      : thinking
        ? "LIORIN…"
        : chess.turn() === "w"
          ? "WHITE"
          : "BLACK";

  const save = useMutation({
    mutationFn: (input: SaveGameInput) => saveAcademyGame({ data: input }),
  });

  const playEngine = useCallback((fromFen: string) => {
    setThinking(true);
    window.setTimeout(() => {
      const used = lesson ? "balanced" : "cold";
      const move = chooseMove(fromFen, used);
      const board = new Chess(fromFen);
      if (!move) {
        setThinking(false);
        return;
      }
      const captured = Boolean(board.get(move.to));
      board.move(move);
      setSans((prev) => [...prev, move.san]);
      setLastMove({ from: move.from, to: move.to });
      if (board.isCheckmate()) chimeMate();
      else if (board.inCheck()) chimeCheck();
      else if (captured) chimeCapture();
      else chimeMove();
      setThinking(false);
    }, 80);
  }, [lesson]);

  const tryMove = (from: Square, to: Square, promotion?: PieceSymbol) => {
    if (thinking || over) return;
    const board = boardFrom(startFen, sans);
    const legal = board.moves({ square: from, verbose: true }).find((m) => m.to === to);
    if (!legal) return;
    if (legal.promotion && !promotion) {
      setPendingPromo({ from, to });
      return;
    }
    const captured = Boolean(board.get(to));
    const played = board.move({ from, to, promotion: promotion ?? legal.promotion });
    if (!played) return;
    setSans((prev) => [...prev, played.san]);
    setLastMove({ from, to });
    setSelected(null);
    setPendingPromo(null);
    if (board.isCheckmate()) chimeMate();
    else if (board.inCheck()) chimeCheck();
    else if (captured) chimeCapture();
    else chimeMove();
    if (!board.isGameOver() && board.turn() !== orient) playEngine(board.fen());
  };

  const onSelect = (square: Square) => {
    if (thinking || over || pendingPromo) return;
    if (chess.turn() !== orient) return;
    const piece = chess.get(square);
    if (selected) {
      if (square === selected) {
        setSelected(null);
        return;
      }
      const legal = chess.moves({ square: selected, verbose: true }).some((m) => m.to === square);
      if (legal) {
        tryMove(selected, square);
        return;
      }
    }
    if (piece && piece.color === chess.turn() && piece.color === orient) setSelected(square);
    else setSelected(null);
  };

  const load = useCallback(
    (fen: string, nextOrient: "w" | "b") => {
      saved.current = false;
      setStartFen(fen);
      setSans([]);
      setSelected(null);
      setPendingPromo(null);
      setLastMove(null);
      setThinking(false);
      setOrient(nextOrient);
      const board = new Chess(fen);
      if (!board.isGameOver() && board.turn() !== nextOrient) playEngine(board.fen());
    },
    [playEngine],
  );

  useEffect(() => {
    if (!lesson) return;
    load(lesson.fen, lesson.fen.includes(" b ") ? "b" : "w");
  }, [lesson, load]);

  useEffect(() => {
    if (!over || saved.current || sans.length < 1) return;
    saved.current = true;
    const liorinColor: "w" | "b" = orient === "w" ? "b" : "w";
    const result = liorinResult(chess, liorinColor);
    save.mutate({
      mode: lesson ? "lesson" : "cold",
      lessonId: lesson?.id ?? null,
      engineProfile: profile,
      liorinColor,
      opponentLabel: "8-bit",
      result,
      ply: sans.length,
      pgn: makePgn({
        startFen,
        sans,
        white: liorinColor === "w" ? "Liorin" : "8-bit",
        black: liorinColor === "b" ? "Liorin" : "8-bit",
        result,
        liorinColor,
      }),
      fenStart: startFen,
      fenEnd: chess.fen(),
      opening: openingName(sans),
    });
  }, [over, chess, sans, orient, lesson, startFen, save, profile]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full max-w-[512px] items-end justify-between gap-3">
        <div>
          <p className="text-[10px] text-muted">PLAYER 1</p>
          <p className="text-xs text-fg">{orient === "w" ? "WHITE" : "BLACK"}</p>
        </div>
        <p className={cn("text-sm", over ? "text-primary" : "text-fg")}>{status}</p>
        <div className="text-right">
          <p className="text-[10px] text-muted">LIORIN</p>
          <p className="text-xs text-primary">{lesson ? "STAGE" : "COLD"}</p>
        </div>
      </div>
      {lesson ? <p className="max-w-[512px] text-center text-[10px] leading-5 text-muted">{lesson.goal.toUpperCase()}</p> : null}
      <PixelBoard
        chess={chess}
        selected={selected}
        onSelect={onSelect}
        orientation={orient}
        lastMove={lastMove}
        disabled={thinking || Boolean(pendingPromo)}
      />
      {pendingPromo ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-muted">PROMOTE</span>
          {(["q", "r", "b", "n"] as const).map((p) => (
            <Button key={p} size="sm" onClick={() => tryMove(pendingPromo.from, pendingPromo.to, p)}>
              {p.toUpperCase()}
            </Button>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          variant="outline"
          onClick={() =>
            load(lesson?.fen ?? START_FEN, lesson && lesson.fen.includes(" b ") ? "b" : "w")
          }
        >
          START
        </Button>
        <Button
          variant="outline"
          disabled={sans.length === 0 || thinking}
          onClick={() => {
            setSans((prev) => {
              if (prev.length === 0) return prev;
              const next = prev.slice(0, -1);
              const board = boardFrom(startFen, next);
              if (board.turn() !== orient && next.length) return next.slice(0, -1);
              return next;
            });
            setSelected(null);
            saved.current = false;
          }}
        >
          SELECT
        </Button>
        <Button variant="ghost" onClick={onStages}>
          STAGES
        </Button>
        <Button variant="ghost" onClick={onTitle}>
          TITLE
        </Button>
      </div>
      {save.data ? <p className="text-[10px] text-primary">GAME SAVED TO ARCHIVE</p> : null}
      <p className="text-[10px] text-muted">START = RESET · SELECT = TAKEBACK</p>
    </div>
  );
}
