import type { Move } from "chess.js";
import { UA } from "./live";
import { LICHESS_CHAT, LICHESS_TEAM_ID } from "./identity";

const LICHESS = "https://lichess.org";

export function moveUci(m: Pick<Move, "from" | "to" | "promotion">) {
  return `${m.from}${m.to}${m.promotion ?? ""}`;
}

async function auth(token: string, path: string, init: RequestInit = {}, ms = 8000) {
  const res = await fetch(`${LICHESS}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "User-Agent": UA,
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(ms),
  });
  const text = await res.text().catch(() => "");
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
  }
  return { res, text, json };
}

function errOf(json: unknown, fallback: string) {
  if (json && typeof json === "object") {
    const o = json as { error?: string; raw?: string };
    if (typeof o.error === "string" && o.error.trim()) return o.error;
    if (typeof o.raw === "string" && o.raw.trim()) return o.raw.slice(0, 180);
  }
  return fallback;
}

export type ChallengeCard = {
  id: string;
  url?: string;
  rated?: boolean;
  challenger?: { id?: string; name?: string; title?: string | null; rating?: number };
  destUser?: { id?: string; name?: string; title?: string | null };
};

export async function listChallenges(token: string) {
  const { res, json } = await auth(token, "/api/challenge");
  if (!res.ok) return { ok: false as const, error: errOf(json, `Lichess ${res.status}`) };
  const bag = (json ?? {}) as { in?: ChallengeCard[]; out?: ChallengeCard[] };
  return { ok: true as const, incoming: bag.in ?? [], outgoing: bag.out ?? [] };
}

export async function acceptChallenge(token: string, id: string) {
  const { res, json } = await auth(token, `/api/challenge/${encodeURIComponent(id)}/accept`, {
    method: "POST",
  });
  if (!res.ok) return { ok: false as const, error: errOf(json, `Lichess ${res.status}`) };
  return { ok: true as const };
}

export async function declineChallenge(token: string, id: string) {
  const body = new URLSearchParams({ reason: "generic" });
  const { res, json } = await auth(token, `/api/challenge/${encodeURIComponent(id)}/decline`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return { ok: false as const, error: errOf(json, `Lichess ${res.status}`) };
  return { ok: true as const };
}

export async function joinLichessTeam(token: string, teamId = LICHESS_TEAM_ID) {
  const { res, text, json } = await auth(token, `/api/team/${encodeURIComponent(teamId)}/join`, {
    method: "POST",
  });
  const blob = `${text} ${JSON.stringify(json ?? {})}`.toLowerCase();
  if (res.ok || blob.includes("already")) return { ok: true as const, already: blob.includes("already") };
  return { ok: false as const, error: errOf(json, `Lichess ${res.status}`) };
}

export type PlayingGame = {
  gameId: string;
  fullId: string;
  fen: string;
  color: "white" | "black";
  lastMove: string | null;
  isMyTurn: boolean;
  rated: boolean;
  secondsLeft: number | null;
  opponent: { id?: string; username: string; rating?: number; title?: string | null };
};

export async function fetchPlaying(token: string) {
  const { res, json } = await auth(token, "/api/account/playing");
  if (!res.ok) return { ok: false as const, error: errOf(json, `Lichess ${res.status}`) };
  const rows = ((json as { nowPlaying?: Record<string, unknown>[] })?.nowPlaying ?? []) as Record<
    string,
    unknown
  >[];
  const games: PlayingGame[] = rows.map((g) => {
    const opp = (g.opponent ?? {}) as { id?: string; username?: string; rating?: number };
    return {
      gameId: String(g.gameId ?? ""),
      fullId: String(g.fullId ?? g.gameId ?? ""),
      fen: String(g.fen ?? ""),
      color: g.color === "black" ? "black" : "white",
      lastMove: typeof g.lastMove === "string" ? g.lastMove : null,
      isMyTurn: Boolean(g.isMyTurn),
      rated: Boolean(g.rated),
      secondsLeft: typeof g.secondsLeft === "number" ? g.secondsLeft : null,
      opponent: {
        id: opp.id,
        username: String(opp.username ?? "opponent"),
        rating: typeof opp.rating === "number" ? opp.rating : undefined,
      },
    };
  });
  return { ok: true as const, games };
}

export async function playBotMove(token: string, gameId: string, uci: string) {
  const { res, json } = await auth(
    token,
    `/api/bot/game/${encodeURIComponent(gameId)}/move/${encodeURIComponent(uci)}`,
    { method: "POST" },
    10_000,
  );
  if (!res.ok) return { ok: false as const, error: errOf(json, `Lichess ${res.status}`) };
  return { ok: true as const };
}

export async function sendBotChat(token: string, gameId: string, text = LICHESS_CHAT) {
  const body = new URLSearchParams({ room: "player", text: text.slice(0, 140) });
  const { res } = await auth(token, `/api/bot/game/${encodeURIComponent(gameId)}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  return { ok: res.ok };
}

export async function abortBotGame(token: string, gameId: string) {
  const { res, json } = await auth(token, `/api/bot/game/${encodeURIComponent(gameId)}/abort`, {
    method: "POST",
  });
  if (!res.ok) return { ok: false as const, error: errOf(json, `Lichess ${res.status}`) };
  return { ok: true as const };
}

export async function exportGamePgn(gameId: string) {
  const res = await fetch(`${LICHESS}/game/export/${encodeURIComponent(gameId)}?clocks=false`, {
    headers: { Accept: "application/x-chess-pgn", "User-Agent": UA },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return { ok: false as const, error: `Export ${res.status}` };
  const pgn = await res.text();
  return { ok: true as const, pgn };
}

export function resultFromPgn(pgn: string, liorinIsWhite: boolean): "win" | "draw" | "loss" {
  const m = pgn.match(/\[Result\s+"([^"]+)"\]/);
  const r = m?.[1] ?? "*";
  if (r === "1/2-1/2") return "draw";
  if (r === "1-0") return liorinIsWhite ? "win" : "loss";
  if (r === "0-1") return liorinIsWhite ? "loss" : "win";
  return "draw";
}

export function plyFromPgn(pgn: string) {
  const moves = pgn.replace(/\{[^}]*\}/g, " ").match(/\b[0-9]+\.\s/g);
  return moves ? moves.length * 2 : 1;
}

export type ArenaInfo = {
  id: string;
  name: string;
  botsAllowed: boolean;
  nbPlayers: number | null;
};

export async function fetchArena(id: string): Promise<ArenaInfo | null> {
  const res = await fetch(`${LICHESS}/api/tournament/${encodeURIComponent(id)}`, {
    headers: { Accept: "application/json", "User-Agent": UA },
    signal: AbortSignal.timeout(7000),
  });
  if (!res.ok) return null;
  const t = (await res.json()) as { id?: string; fullName?: string; botsAllowed?: boolean; nbPlayers?: number };
  return {
    id: t.id ?? id,
    name: t.fullName ?? id,
    botsAllowed: Boolean(t.botsAllowed),
    nbPlayers: typeof t.nbPlayers === "number" ? t.nbPlayers : null,
  };
}

export async function joinArena(token: string, id: string) {
  const { res, json } = await auth(token, `/api/tournament/${encodeURIComponent(id)}/join`, {
    method: "POST",
  });
  if (!res.ok) return { ok: false as const, error: errOf(json, `Lichess ${res.status}`) };
  return { ok: true as const };
}
