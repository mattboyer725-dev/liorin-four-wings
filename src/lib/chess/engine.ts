import { Chess, type Move, type PieceSymbol, type Square } from "chess.js";
import { bookMove, fenKey } from "./book.ts";

const VALUE: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};

const PST: Record<PieceSymbol, number[]> = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10,
    25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10,
    10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0,
    -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30,
    -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10,
    5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0,
    0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5,
    0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0,
    5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10,
    -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50,
    -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20,
  ],
};

const KING_END: number[] = [
  -50, -30, -30, -30, -30, -30, -30, -50, -30, -10, 0, 0, 0, 0, -10, -30, -30, 0, 10, 15, 15, 10, 0,
  -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 0, 10, 15, 15, 10, 0, -30,
  -30, -10, 0, 0, 0, 0, -10, -30, -50, -30, -30, -30, -30, -30, -30, -50,
];

function indexOf(square: Square, white: boolean) {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  const i = (7 - rank) * 8 + file;
  return white ? i : 63 - i;
}

function materialOnly(chess: Chess) {
  let s = 0;
  for (const row of chess.board()) {
    for (const cell of row) {
      if (!cell) continue;
      s += (cell.color === "w" ? 1 : -1) * VALUE[cell.type];
    }
  }
  return s;
}

export function evaluate(chess: Chess) {
  if (chess.isCheckmate()) return chess.turn() === "w" ? -100000 : 100000;
  if (chess.isDraw()) return 0;
  let score = 0;
  let whiteB = 0;
  let blackB = 0;
  let whiteNonPawn = 0;
  let blackNonPawn = 0;
  let wk: Square | null = null;
  let bk: Square | null = null;
  const wPawns = [0, 0, 0, 0, 0, 0, 0, 0];
  const bPawns = [0, 0, 0, 0, 0, 0, 0, 0];
  for (const row of chess.board()) {
    for (const cell of row) {
      if (!cell) continue;
      const sign = cell.color === "w" ? 1 : -1;
      score += sign * VALUE[cell.type];
      if (cell.type === "k") {
        if (cell.color === "w") wk = cell.square;
        else bk = cell.square;
        continue;
      }
      score += sign * (PST[cell.type][indexOf(cell.square, cell.color === "w")] ?? 0);
      if (cell.type === "b") {
        if (cell.color === "w") whiteB += 1;
        else blackB += 1;
      }
      if (cell.type !== "p") {
        if (cell.color === "w") whiteNonPawn += 1;
        else blackNonPawn += 1;
      }
      if (cell.type === "p") {
        const file = cell.square.charCodeAt(0) - 97;
        if (cell.color === "w") wPawns[file]! += 1;
        else bPawns[file]! += 1;
      }
    }
  }
  if (whiteB >= 2) score += 35;
  if (blackB >= 2) score -= 35;
  for (let f = 0; f < 8; f++) {
    if (wPawns[f]! > 1) score -= 14 * (wPawns[f]! - 1);
    if (bPawns[f]! > 1) score += 14 * (bPawns[f]! - 1);
    const wIso = Boolean(wPawns[f]) && !wPawns[f - 1] && !wPawns[f + 1];
    const bIso = Boolean(bPawns[f]) && !bPawns[f - 1] && !bPawns[f + 1];
    if (wIso) score -= 10;
    if (bIso) score += 10;
  }
  const rights = chess.getCastlingRights("w");
  if (rights.k || rights.q) score += 18;
  const br = chess.getCastlingRights("b");
  if (br.k || br.q) score -= 18;
  const endgame = whiteNonPawn + blackNonPawn <= 6;
  if (wk) score += (endgame ? KING_END : PST.k)[indexOf(wk, true)] ?? 0;
  if (bk) score -= (endgame ? KING_END : PST.k)[indexOf(bk, false)] ?? 0;
  if (endgame && wk && bk) {
    const wf = wk.charCodeAt(0) - 97;
    const wr = Number(wk[1]) - 1;
    const bf = bk.charCodeAt(0) - 97;
    const brn = Number(bk[1]) - 1;
    const sep = Math.max(Math.abs(wf - bf), Math.abs(wr - brn));
    const edge = Math.min(bf, 7 - bf, brn, 7 - brn);
    if (score > 200) {
      score += (4 - sep) * 12;
      score += (3 - edge) * 18;
    } else if (score < -200) {
      score -= (4 - sep) * 12;
      score -= (3 - edge) * 18;
    }
  }
  return score;
}

/** Side-to-move score. `evaluate` is White-positive; negamax needs the player to move. */
function evalSTM(chess: Chess) {
  const s = evaluate(chess);
  return chess.turn() === "w" ? s : -s;
}

function orderedMoves(chess: Chess, tactics: boolean, hashMove?: string): Move[] {
  const moves = chess.moves({ verbose: true });
  return moves.sort((a, b) => {
    const aHash = hashMove && `${a.from}${a.to}${a.promotion ?? ""}` === hashMove ? 4000 : 0;
    const bHash = hashMove && `${b.from}${b.to}${b.promotion ?? ""}` === hashMove ? 4000 : 0;
    const capA = a.captured ? VALUE[a.captured] - VALUE[a.piece] / 10 : 0;
    const capB = b.captured ? VALUE[b.captured] - VALUE[b.piece] / 10 : 0;
    const checkA = a.san.includes("#") ? 900 : a.san.includes("+") ? 40 : 0;
    const checkB = b.san.includes("#") ? 900 : b.san.includes("+") ? 40 : 0;
    const promoA = a.promotion ? 80 : 0;
    const promoB = b.promotion ? 80 : 0;
    const bias = tactics ? 1.4 : 1;
    return bHash + capB * bias + checkB + promoB - (aHash + capA * bias + checkA + promoA);
  });
}

function isNoisy(m: Move) {
  return Boolean(m.captured) || Boolean(m.promotion) || m.san.includes("+") || m.san.includes("#");
}

function uciOf(m: Move) {
  return `${m.from}${m.to}${m.promotion ?? ""}`;
}

type Deadline = { t: number };

function quiesce(
  chess: Chess,
  alpha: number,
  beta: number,
  remain: number,
  deadline: Deadline,
): number {
  if (Date.now() > deadline.t) return evalSTM(chess);
  if (chess.isCheckmate()) return -100000;
  if (chess.isDraw()) return 0;
  const stand = evalSTM(chess);
  if (remain <= 0) return stand;
  if (stand >= beta) return stand;
  if (stand > alpha) alpha = stand;
  for (const m of orderedMoves(chess, true).filter(isNoisy)) {
    if (Date.now() > deadline.t) break;
    chess.move(m);
    const score = -quiesce(chess, -beta, -alpha, remain - 1, deadline);
    chess.undo();
    if (score >= beta) return score;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

type Tt = Map<string, { depth: number; score: number; move: string }>;

function negamax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  ply: number,
  tactics: boolean,
  qsearch: boolean,
  deadline: Deadline,
  tt: Tt,
): number {
  if (Date.now() > deadline.t) return evalSTM(chess);
  if (chess.isCheckmate()) return -100000 + ply;
  if (chess.isThreefoldRepetition() || chess.isStalemate() || chess.isInsufficientMaterial()) {
    return 0;
  }
  if (chess.isDraw()) return 0;
  const key = fenKey(chess.fen());
  const hit = tt.get(key);
  if (hit && hit.depth >= depth) return hit.score;
  if (depth === 0) {
    return qsearch ? quiesce(chess, alpha, beta, 2, deadline) : evalSTM(chess);
  }
  const moves = orderedMoves(chess, tactics, hit?.move);
  if (!moves.length) return evalSTM(chess);
  let best = -Infinity;
  let bestMove = uciOf(moves[0]!);
  for (const m of moves) {
    if (Date.now() > deadline.t) break;
    chess.move(m);
    const score = -negamax(chess, depth - 1, -beta, -alpha, ply + 1, tactics, qsearch, deadline, tt);
    chess.undo();
    if (score > best) {
      best = score;
      bestMove = uciOf(m);
    }
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  tt.set(key, { depth, score: best, move: bestMove });
  return best;
}

export type EngineProfile = "fast" | "balanced" | "deep" | "tactics" | "cold";

const BUDGET: Record<EngineProfile, number> = {
  fast: 40,
  balanced: 180,
  deep: 500,
  tactics: 220,
  cold: 850,
};

const MAX_DEPTH: Record<EngineProfile, number> = {
  fast: 1,
  balanced: 2,
  deep: 3,
  tactics: 2,
  cold: 4,
};

function drawScore(chess: Chess, maximizing: boolean) {
  const mat = materialOnly(chess);
  const ahead = maximizing ? mat > 80 : mat < -80;
  const behind = maximizing ? mat < -80 : mat > 80;
  if (ahead) return -8000;
  if (behind) return 9000;
  return 0;
}

function shufflePenalty(chess: Chess, m: Move) {
  const hist = chess.history({ verbose: true });
  if (hist.length < 2) return 0;
  const lastUs = hist[hist.length - 2];
  if (!lastUs) return 0;
  if (lastUs.to === m.from && lastUs.from === m.to && lastUs.piece === m.piece && !m.captured) {
    return 220;
  }
  return 0;
}

function opponentMatesNext(chess: Chess) {
  for (const m of chess.moves({ verbose: true })) {
    chess.move(m);
    const mate = chess.isCheckmate();
    chess.undo();
    if (mate) return true;
  }
  return false;
}

let engineSalt = 0;

export function setEngineSalt(n: number) {
  engineSalt = n >>> 0;
}

export function chooseMoveFrom(chess: Chess, profile: EngineProfile, budgetMs?: number): Move | null {
  if (profile === "cold") {
    const book = bookMove(chess, engineSalt);
    if (book) return book;
  }

  const tactics = profile === "tactics" || profile === "cold";
  const qsearch = profile === "cold" || profile === "deep";
  const moves = orderedMoves(chess, tactics);
  if (!moves.length) return null;

  for (const m of moves) {
    chess.move(m);
    const mate = chess.isCheckmate();
    chess.undo();
    if (mate) return m;
  }

  const maximizing = chess.turn() === "w";
  const budget = budgetMs ?? BUDGET[profile];
  const deadline: Deadline = { t: Date.now() + Math.max(30, budget) };
  const tt: Tt = new Map();
  const maxDepth = MAX_DEPTH[profile];
  let best = moves[0]!;
  const mat = materialOnly(chess);
  const behind = maximizing ? mat < -80 : mat > 80;
  const ply = chess.history().length;

  for (let depth = 1; depth <= maxDepth; depth++) {
    if (Date.now() > deadline.t && depth > 1) break;
    let layerBest = best;
    let layerScore = -Infinity;
    let finished = true;
    for (const m of orderedMoves(chess, tactics, uciOf(best))) {
      if (Date.now() > deadline.t && depth > 1) {
        finished = false;
        break;
      }
      chess.move(m);
      let score: number;
      if (chess.isCheckmate()) {
        chess.undo();
        return m;
      }
      if (profile === "cold" && opponentMatesNext(chess)) {
        chess.undo();
        continue;
      }
      if (chess.isThreefoldRepetition() || chess.isStalemate() || chess.isDraw()) {
        score = drawScore(chess, maximizing);
      } else {
        score = -negamax(chess, depth - 1, -Infinity, Infinity, 1, tactics, qsearch, deadline, tt);
      }
      chess.undo();
      if (!behind) score -= shufflePenalty(chess, m);
      if (m.piece === "k" && !m.captured && !/[kq]/.test(m.flags) && ply < 40) score -= 80;
      if (m.piece === "q" && !m.captured && ply < 12) score -= 400;
      const back = m.color === "w" ? "1" : "8";
      if ((m.piece === "n" || m.piece === "b") && m.to[1] === back && !m.captured && ply < 24) {
        score -= 300;
      }
      if (score > layerScore) {
        layerScore = score;
        layerBest = m;
      }
    }
    if (finished || depth === 1) best = layerBest;
  }

  return best;
}

export function chooseMove(fen: string, profile: EngineProfile): Move | null {
  const chess = new Chess(fen);
  return chooseMoveFrom(chess, profile);
}

export function chooseUci(
  chess: Chess,
  opts?: { profile?: EngineProfile; budgetMs?: number; salt?: number },
): string | null {
  if (opts?.salt != null) setEngineSalt(opts.salt);
  const m = chooseMoveFrom(chess, opts?.profile ?? "cold", opts?.budgetMs);
  if (!m) return null;
  return uciOf(m);
}

/** Sparring dummy — material-only, 1 ply, no book. Not Liorin. */
export function chooseFieldMove(chess: Chess): Move | null {
  const moves = chess.moves({ verbose: true });
  if (!moves.length) return null;
  for (const m of moves) {
    chess.move(m);
    const mate = chess.isCheckmate();
    chess.undo();
    if (mate) return m;
  }
  const dummyWhite = chess.turn() === "w";
  let best = moves[0]!;
  let bestScore = -Infinity;
  for (const m of moves) {
    chess.move(m);
    const mat = materialOnly(chess);
    chess.undo();
    const score = dummyWhite ? mat : -mat;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}
