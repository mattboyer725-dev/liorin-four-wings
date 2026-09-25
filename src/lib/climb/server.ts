import { createServerFn } from "@tanstack/react-start";
import { Chess } from "chess.js";
import { chooseFieldMove, chooseMoveFrom } from "@/lib/chess/engine";
import { LICHESS_HANDLE, LICHESS_PROFILE } from "@/lib/platforms/identity";
import { fetchLichessUser, fetchNdjson, fetchOnlineBots, fetchTvBot } from "@/lib/platforms/live";
import { bestBotRating } from "@/lib/conquest/format";
import { importFieldGames } from "@/lib/games/field-sync";

export type ProofGame = {
  id: string;
  result: "win" | "draw" | "loss";
  status: string;
  color: "w" | "b";
  opponent: string;
  opponentRating: number | null;
  opening: string;
  url: string;
};

export type ClimbProof = {
  handle: string;
  profile: string;
  title: string | null;
  blitz: { games: number; rating: number; rd: number; prov: boolean } | null;
  count: { all: number; win: number; draw: number; loss: number; playing: number };
  playingUrl: string | null;
  games: ProofGame[];
  onlineBots: number;
  fieldLeader: { username: string; rating: number } | null;
  rankAmongOnline: number | null;
  gapToLeader: number | null;
  worldBestClaim: false;
  verdict: string;
  tv: { username: string; rating: number; url: string } | null;
  fetchedAt: string;
};

type LichessGame = {
  id: string;
  status?: string;
  winner?: "white" | "black";
  players?: {
    white?: { user?: { name?: string; id?: string }; rating?: number };
    black?: { user?: { name?: string; id?: string }; rating?: number };
  };
  opening?: { name?: string };
};

function gameResult(g: LichessGame): ProofGame {
  const w = g.players?.white;
  const b = g.players?.black;
  const wn = (w?.user?.name || w?.user?.id || "").toLowerCase();
  const meWhite = wn === LICHESS_HANDLE.toLowerCase();
  const opp = meWhite ? b : w;
  const oppName = opp?.user?.name || opp?.user?.id || "BOT";
  let result: "win" | "draw" | "loss" = "draw";
  if (g.status !== "draw" && g.status !== "stalemate" && g.winner) {
    const won = (g.winner === "white") === meWhite;
    result = won ? "win" : "loss";
  }
  return {
    id: g.id,
    result,
    status: g.status || "unknown",
    color: meWhite ? "w" : "b",
    opponent: oppName,
    opponentRating: opp?.rating ?? null,
    opening: g.opening?.name || "Field game",
    url: `https://lichess.org/${g.id}`,
  };
}

export const getClimbProof = createServerFn({ method: "GET" }).handler(async (): Promise<ClimbProof> => {
  try {
    await importFieldGames();
  } catch {
    /* archive is best-effort */
  }
  const [user, gamesRaw, bots, tv] = await Promise.all([
    fetchLichessUser(LICHESS_HANDLE),
    fetchNdjson<LichessGame>(
      `https://lichess.org/api/games/user/${LICHESS_HANDLE}?max=24&moves=false&opening=true&rated=true`,
    ).catch(() => [] as LichessGame[]),
    fetchOnlineBots(50).catch(() => []),
    fetchTvBot().catch(() => null),
  ]);

  const games = gamesRaw.map(gameResult);
  const blitzPerf = user?.perfs?.blitz;
  const blitz = blitzPerf
    ? {
        games: blitzPerf.games ?? 0,
        rating: blitzPerf.rating ?? 1500,
        rd: blitzPerf.rd ?? 350,
        prov: Boolean(blitzPerf.prov),
      }
    : null;

  const ranked = [...bots]
    .map((b) => ({ username: b.username, rating: bestBotRating(b) }))
    .sort((a, b) => b.rating - a.rating);
  const fieldLeader = ranked[0] ?? null;
  const us = blitz?.rating ?? 0;
  const ourRank = blitz
    ? ranked.filter((b) => b.rating > us).length + 1
    : null;
  const gap = fieldLeader && blitz ? fieldLeader.rating - blitz.rating : null;

  const count = {
    all: user?.count?.all ?? games.length,
    win: user?.count?.win ?? games.filter((g) => g.result === "win").length,
    draw: user?.count?.draw ?? games.filter((g) => g.result === "draw").length,
    loss: user?.count?.loss ?? games.filter((g) => g.result === "loss").length,
    playing: user?.count?.playing ?? 0,
  };

  const playingUrl =
    typeof user?.playing === "string"
      ? user.playing
      : count.playing
        ? `${LICHESS_PROFILE}/tv`
        : null;

  const verdict = fieldLeader
    ? `Target is first among public BOT boards. Online field leader is ${fieldLeader.username} at ${fieldLeader.rating}. Liorin is ${blitz?.rating ?? "unrated"}${blitz?.prov ? " (provisional)" : ""}. World's best is a gate, not a slogan — this sheet has to pass it.`
    : "Live field list is quiet. Public Lichess games remain the proof.";

  return {
    handle: LICHESS_HANDLE,
    profile: LICHESS_PROFILE,
    title: user?.title ?? null,
    blitz,
    count,
    playingUrl,
    games,
    onlineBots: bots.length,
    fieldLeader,
    rankAmongOnline: ourRank,
    gapToLeader: gap,
    worldBestClaim: false,
    verdict,
    tv: tv ? { username: tv.username, rating: tv.rating, url: tv.url } : null,
    fetchedAt: new Date().toISOString(),
  };
});

export const runInternalArena = createServerFn({ method: "POST" }).handler(async () => {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  const games: { result: "win" | "draw" | "loss"; ply: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const chess = new Chess();
    for (let ply = 0; ply < 120; ply++) {
      if (chess.isGameOver()) break;
      const white = chess.turn() === "w";
      const move = white ? chooseMoveFrom(chess, "cold", 180) : chooseFieldMove(chess);
      if (!move) break;
      chess.move(move);
    }
    let result: "win" | "draw" | "loss" = "draw";
    if (chess.isCheckmate()) result = chess.turn() === "b" ? "win" : "loss";
    if (result === "win") wins += 1;
    else if (result === "loss") losses += 1;
    else draws += 1;
    games.push({ result, ply: chess.history().length });
  }
  return {
    vs: "field dummy (material 1-ply)",
    games: games.length,
    wins,
    draws,
    losses,
    score: (wins + 0.5 * draws) / Math.max(1, games.length),
    note: "Internal dummy arena. Not a world-best proof. Public BOT boards are the proof.",
  };
});
