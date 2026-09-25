import { Chess, type Move } from "chess.js";

/** FEN without halfmove/fullmove clocks — opening keys. */
export function fenKey(fen: string) {
  return fen.split(" ").slice(0, 4).join(" ");
}

/**
 * Academy repertoire. Each line is SAN from the start position.
 * First move stored for a key wins, so put preferred White (e4 / Italian)
 * and solid Black (e5 / d5) replies first. Opponent deviations are listed
 * so the engine answers them from the library instead of searching.
 */
const LINES: string[] = [
  "e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3 d6 O-O O-O Re1 a5 Nbd2",
  "e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4 exd4 cxd4 Bb4+ Bd2 Bxd2+ Nbxd2",
  "e4 e5 Nf3 Nc6 Bc4 Bc5 d3 Nf6 O-O d6 c3 a6",
  "e4 e5 Nf3 Nc6 Bc4 Nf6 d3 Bc5 O-O d6 c3",
  "e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Na5 Bb5+ c6 dxc6 bxc6 Be2",
  "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3",
  "e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4 d4 Nd6 Bxc6 dxc6 dxe5",
  "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Nxe4 d4 b5 Bb3 d5 dxe5",
  "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nc3 Bb4 Nxc6 bxc6 Bd3",
  "e4 e5 Nf3 Nf6 Nxe5 d6 Nf3 Nxe4 d4 d5 Bd3",
  "e4 e5 Nc3 Nf6 f4 d5 fxe5 Nxe4 Nf3",
  "e4 e5 f4 exf4 Nf3 g5 h4",
  "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be2 e5 Nb3",
  "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be3 Bg7 f3",
  "e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5 Ndb5 d6",
  "e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6 Nc3 Qc7",
  "e4 c5 Nf3 Nc6 Bb5 g6 O-O Bg7 Re1",
  "e4 c5 c3 Nf6 e5 Nd5 d4 cxd4 Nf3",
  "e4 e6 d4 d5 Nc3 Nf6 Bg5 Be7 e5 Nfd7 Bxe7 Qxe7",
  "e4 e6 d4 d5 Nd2 Nf6 e5 Nfd7 Bd3 c5 c3 Nc6",
  "e4 e6 d4 d5 e5 c5 c3 Nc6 Nf3 Qb6",
  "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6",
  "e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2",
  "e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6 Nf3",
  "e4 d5 exd5 Nf6 d4 Nxd5 Nf3",
  "e4 d6 d4 Nf6 Nc3 g6 Be3 Bg7 Qd2",
  "e4 Nf6 e5 Nd5 d4 d6 Nf3 Bg4 Be2",
  "e4 g6 d4 Bg7 Nc3 d6 Be3 Nf6 Qd2",
  "e4 Nc6 d4 d5 e5 Bf5 Nf3",
  "d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3",
  "d4 d5 c4 c6 Nc3 Nf6 Nf3 e6 e3",
  "d4 d5 c4 dxc4 e3 Nf6 Bxc4 e5",
  "d4 d5 Nf3 Nf6 c4 e6 g3",
  "d4 Nf6 c4 e6 Nc3 Bb4 Qc2 O-O a3",
  "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2",
  "d4 Nf6 c4 e6 Nf3 b6 g3 Ba6 b3",
  "d4 Nf6 Nf3 g6 c4 Bg7 Nc3 O-O",
  "d4 e6 c4 Nf6 Nc3 Bb4",
  "c4 e5 Nc3 Nf6 Nf3 Nc6 g3",
  "c4 Nf6 Nc3 e5 Nf3 Nc6",
  "Nf3 d5 g3 Nf6 Bg2 e6 O-O Be7",
  "Nf3 Nf6 g3 g6 Bg2 Bg7 O-O O-O",
];

export const BOOK_SAN: Record<string, string> = {};
export const BOOK_SANS: Record<string, string[]> = {};

function build() {
  for (const line of LINES) {
    const chess = new Chess();
    for (const san of line.split(/\s+/)) {
      const key = fenKey(chess.fen());
      if (!BOOK_SANS[key]) BOOK_SANS[key] = [];
      if (!BOOK_SANS[key].includes(san)) BOOK_SANS[key].push(san);
      if (!BOOK_SAN[key]) BOOK_SAN[key] = san;
      const moved = chess.move(san);
      if (!moved) break;
    }
  }
}
build();

function hash32(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function bookMove(chess: Chess, salt = 0): Move | null {
  const key = fenKey(chess.fen());
  const list = BOOK_SANS[key];
  if (!list?.length) return null;
  const idx = salt === 0 || list.length === 1 ? 0 : hash32(`${key}|${salt}`) % list.length;
  const san = list[idx]!;
  try {
    const m = chess.move(san);
    chess.undo();
    return m;
  } catch {
    return null;
  }
}

export const BOOK_SIZE = Object.keys(BOOK_SANS).length;
