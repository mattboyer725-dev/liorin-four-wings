import { Chess } from "chess.js";
import { START_FEN } from "@/lib/chess/pgn";
import { LICHESS_HANDLE } from "@/lib/platforms/identity";
import { fetchNdjson } from "@/lib/platforms/live";
import { insertAcademyGame, listAcademyGames } from "./store";

type LxGame = {
  id: string;
  status?: string;
  winner?: "white" | "black";
  moves?: string;
  pgn?: string;
  rated?: boolean;
  players?: {
    white?: { user?: { name?: string; id?: string } };
    black?: { user?: { name?: string; id?: string } };
  };
  opening?: { name?: string };
};

function playUci(moves: string) {
  const chess = new Chess();
  for (const u of moves.trim().split(/\s+/).filter(Boolean)) {
    const from = u.slice(0, 2);
    const to = u.slice(2, 4);
    const promotion = u.length > 4 ? u[4] : undefined;
    try {
      chess.move({ from, to, promotion });
    } catch {
      break;
    }
  }
  return chess;
}

export async function importFieldGames(): Promise<number> {
  const rows = await fetchNdjson<LxGame>(
    `https://lichess.org/api/games/user/${LICHESS_HANDLE}?max=32&moves=true&opening=true&pgnInJson=true&rated=true`,
    9000,
  );
  const existing = await listAcademyGames(80);
  const seen = new Set<string>();
  for (const g of existing) {
    const m = g.pgn.match(/lichess\.org\/([A-Za-z0-9]{8,12})/i);
    if (m?.[1]) seen.add(m[1]);
  }
  let n = 0;
  for (const g of rows) {
    if (!g.id || seen.has(g.id)) continue;
    const wName = (g.players?.white?.user?.name || g.players?.white?.user?.id || "").toLowerCase();
    const meWhite = wName === LICHESS_HANDLE.toLowerCase();
    const opp = meWhite ? g.players?.black : g.players?.white;
    const oppName = opp?.user?.name || opp?.user?.id || "BOT";
    let result: "win" | "draw" | "loss" = "draw";
    if (g.winner === "white") result = meWhite ? "win" : "loss";
    else if (g.winner === "black") result = meWhite ? "loss" : "win";
    const board = playUci(g.moves || "");
    const ply = Math.max(1, board.history().length);
    const pgn =
      (g.pgn && g.pgn.trim()) ||
      `[Event "LIORIN Field"]\n[Site "https://lichess.org/${g.id}"]\n[White "${meWhite ? "Liorin" : oppName}"]\n[Black "${meWhite ? oppName : "Liorin"}"]\n\n*`;
    await insertAcademyGame({
      mode: "field",
      lessonId: null,
      engineProfile: "cold",
      liorinColor: meWhite ? "w" : "b",
      opponentLabel: oppName,
      result,
      ply,
      pgn: pgn.slice(0, 8000),
      fenStart: START_FEN,
      fenEnd: board.fen().slice(0, 120),
      opening: g.opening?.name?.slice(0, 48) || "Field game",
    });
    seen.add(g.id);
    n += 1;
  }
  return n;
}
