/**
 * Chess AI Engine — iterative deepening + alpha-beta pruning + transposition table
 *
 * getBestMove(gameState, timeBudgetMs) → Move | null
 *
 * Evaluation: material + piece-square tables + mobility bonus
 * Search: iterative deepening with per-node deadline check, transposition table
 * Move ordering: TT hint → captures (MVV-LVA) → quiet moves
 */

import type {
  BoardState,
  GameState,
  Move,
  Piece,
  PieceColor,
  PieceType,
  Position,
} from "../types/chess";
import { applyMove, getLegalMoves, isInCheck } from "./chess";

// ─── Material Values ──────────────────────────────────────────────────────────

const PIECE_VALUE: Record<PieceType, number> = {
  Pawn: 100,
  Knight: 320,
  Bishop: 330,
  Rook: 500,
  Queen: 900,
  King: 20000,
};

// ─── Piece-Square Tables (from White's perspective, row 0 = rank 8) ───────────

// prettier-ignore
const PST_PAWN: number[] = [
  0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30,
  20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10,
  0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
];

// prettier-ignore
const PST_KNIGHT: number[] = [
  -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30,
  0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20,
  15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40,
  -50, -40, -30, -30, -30, -30, -40, -50,
];

// prettier-ignore
const PST_BISHOP: number[] = [
  -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5,
  10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0,
  -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10,
  -10, -10, -10, -10, -10, -20,
];

// prettier-ignore
const PST_ROOK: number[] = [
  0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0,
  -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0,
  -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0,
];

// prettier-ignore
const PST_QUEEN: number[] = [
  -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5,
  5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5,
  5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10,
  -20,
];

// Middlegame king table — prefer castled / corner positions
// prettier-ignore
const PST_KING_MG: number[] = [
  -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40,
  -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40,
  -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20,
  -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20,
];

const PST: Record<PieceType, number[]> = {
  Pawn: PST_PAWN,
  Knight: PST_KNIGHT,
  Bishop: PST_BISHOP,
  Rook: PST_ROOK,
  Queen: PST_QUEEN,
  King: PST_KING_MG,
};

// ─── Evaluation ───────────────────────────────────────────────────────────────

function pstIndex(row: number, col: number, color: PieceColor): number {
  const r = color === "White" ? 7 - row : row;
  return r * 8 + col;
}

function evaluateBoard(board: BoardState): number {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const material = PIECE_VALUE[piece.type];
      const positional = PST[piece.type][pstIndex(r, c, piece.color)];
      const value = material + positional;
      score += piece.color === "White" ? value : -value;
    }
  }
  return score;
}

function mobilityBonus(
  board: BoardState,
  color: PieceColor,
  enPassant: Position | null,
): number {
  let mobility = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        mobility += getLegalMoves(board, { row: r, col: c }, enPassant).length;
      }
    }
  }
  return mobility;
}

function evaluate(state: GameState): number {
  const material = evaluateBoard(state.board);
  const whiteM = mobilityBonus(state.board, "White", state.enPassantTarget);
  const blackM = mobilityBonus(state.board, "Black", state.enPassantTarget);
  return material + (whiteM - blackM) * 5;
}

// ─── Move Enumeration ─────────────────────────────────────────────────────────

function enumerateMoves(
  state: GameState,
): Array<{ from: Position; to: Position }> {
  const moves: Array<{ from: Position; to: Position }> = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = state.board[r][c];
      if (!piece || piece.color !== state.currentTurn) continue;
      const targets = getLegalMoves(
        state.board,
        { row: r, col: c },
        state.enPassantTarget,
      );
      for (const to of targets) {
        moves.push({ from: { row: r, col: c }, to });
      }
    }
  }
  return moves;
}

// ─── Move Ordering (TT hint + MVV-LVA) ───────────────────────────────────────

function mvvLvaScore(board: BoardState, from: Position, to: Position): number {
  const attacker = board[from.row][from.col];
  const victim = board[to.row][to.col];
  if (!attacker) return 0;
  if (!victim) return 0;
  return PIECE_VALUE[victim.type] * 10 - PIECE_VALUE[attacker.type];
}

function orderMoves(
  state: GameState,
  moves: Array<{ from: Position; to: Position }>,
  ttBestFrom: Position | null,
  ttBestTo: Position | null,
): Array<{ from: Position; to: Position }> {
  return [...moves].sort((a, b) => {
    // TT hint move goes first
    const aIsTT =
      ttBestFrom &&
      ttBestTo &&
      a.from.row === ttBestFrom.row &&
      a.from.col === ttBestFrom.col &&
      a.to.row === ttBestTo.row &&
      a.to.col === ttBestTo.col
        ? 1
        : 0;
    const bIsTT =
      ttBestFrom &&
      ttBestTo &&
      b.from.row === ttBestFrom.row &&
      b.from.col === ttBestFrom.col &&
      b.to.row === ttBestTo.row &&
      b.to.col === ttBestTo.col
        ? 1
        : 0;
    if (aIsTT !== bIsTT) return bIsTT - aIsTT;

    const scoreB = mvvLvaScore(state.board, b.from, b.to);
    const scoreA = mvvLvaScore(state.board, a.from, a.to);
    return scoreB - scoreA;
  });
}

// ─── Transposition Table ──────────────────────────────────────────────────────

type TTFlag = "exact" | "lower" | "upper";

interface TTEntry {
  depth: number;
  score: number;
  flag: TTFlag;
  bestFrom: Position | null;
  bestTo: Position | null;
}

// Board hash key: encode board + turn + en-passant into a compact string
function boardKey(state: GameState): string {
  let key = state.currentTurn[0];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = state.board[r][c];
      if (p) {
        key += `${r}${c}${p.color[0]}${p.type[0]}`;
      }
    }
  }
  if (state.enPassantTarget) {
    key += `E${state.enPassantTarget.row}${state.enPassantTarget.col}`;
  }
  return key;
}

// ─── Timeout Error ────────────────────────────────────────────────────────────

class SearchTimeout extends Error {}

// ─── Search State ─────────────────────────────────────────────────────────────

interface SearchContext {
  deadline: number;
  nodeCount: number;
  tt: Map<string, TTEntry>;
}

const CHECKMATE_SCORE = 100000;

// ─── Negamax with Alpha-Beta + TT + Timeout ───────────────────────────────────

function negamax(
  state: GameState,
  depth: number,
  alphaIn: number,
  betaIn: number,
  ctx: SearchContext,
): number {
  // Check deadline every 128 nodes
  ctx.nodeCount++;
  if ((ctx.nodeCount & 127) === 0 && Date.now() >= ctx.deadline) {
    throw new SearchTimeout();
  }

  // TT probe
  const key = boardKey(state);
  const ttEntry = ctx.tt.get(key);
  if (ttEntry && ttEntry.depth >= depth) {
    if (ttEntry.flag === "exact") return ttEntry.score;
    if (ttEntry.flag === "lower" && ttEntry.score > alphaIn) {
      if (ttEntry.score >= betaIn) return ttEntry.score;
    }
    if (ttEntry.flag === "upper" && ttEntry.score < betaIn) {
      if (ttEntry.score <= alphaIn) return ttEntry.score;
    }
  }

  // Terminal check
  if (isTerminal(state)) return terminalScore(state, depth);
  if (depth === 0) return leafScore(state);

  const rawMoves = enumerateMoves(state);
  if (rawMoves.length === 0) return leafScore(state);

  const ttBestFrom = ttEntry?.bestFrom ?? null;
  const ttBestTo = ttEntry?.bestTo ?? null;
  const ordered = orderMoves(state, rawMoves, ttBestFrom, ttBestTo);

  let alpha = alphaIn;
  let best = Number.NEGATIVE_INFINITY;
  let bestFrom: Position | null = null;
  let bestTo: Position | null = null;

  for (const { from, to } of ordered) {
    const piece = state.board[from.row][from.col];
    const isPromo = piece?.type === "Pawn" && (to.row === 0 || to.row === 7);
    const next = applyMove(state, from, to, isPromo ? "Queen" : undefined);
    // Negate: next state is opponent's turn, score is from their perspective
    const score = -negamax(next, depth - 1, -betaIn, -alpha, ctx);

    if (score > best) {
      best = score;
      bestFrom = from;
      bestTo = to;
    }
    if (best > alpha) alpha = best;
    if (alpha >= betaIn) break; // β cutoff
  }

  // Store in TT
  let flag: TTFlag = "exact";
  if (best <= alphaIn) flag = "upper";
  else if (best >= betaIn) flag = "lower";
  ctx.tt.set(key, { depth, score: best, flag, bestFrom, bestTo });

  return best;
}

function isTerminal(state: GameState): boolean {
  return (
    state.status === "checkmate" ||
    state.status === "stalemate" ||
    state.status === "draw-fifty" ||
    state.status === "draw-threefold" ||
    state.status === "draw-insufficient"
  );
}

function terminalScore(state: GameState, depth: number): number {
  if (state.status === "checkmate") {
    // Current side to move is in checkmate — they lose
    return -(CHECKMATE_SCORE + depth);
  }
  return 0; // stalemate / draw
}

function leafScore(state: GameState): number {
  // Return score from perspective of side to move (negamax convention)
  const abs = evaluate(state);
  return state.currentTurn === "White" ? abs : -abs;
}

// ─── Difficulty Time Budgets ──────────────────────────────────────────────────

const DIFFICULTY_TIME_MS: Record<number, number> = {
  1: 100,
  2: 200,
  3: 350,
  4: 600,
  5: 900,
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the best move for the current player given the game state.
 * Uses iterative deepening with a time budget per difficulty level.
 * Returns null if there are no legal moves (checkmate / stalemate).
 *
 * timeBudgetMs is determined by difficulty:
 *   1 → 100ms, 2 → 200ms, 3 → 350ms, 4 → 600ms, 5 → 900ms
 */
export function getBestMove(
  gameState: GameState,
  difficulty: number,
): Move | null {
  const rawMoves = enumerateMoves(gameState);
  if (rawMoves.length === 0) return null;

  const timeBudget = DIFFICULTY_TIME_MS[difficulty] ?? 900;
  const deadline = Date.now() + timeBudget;

  const ctx: SearchContext = {
    deadline,
    nodeCount: 0,
    tt: new Map<string, TTEntry>(),
  };

  let bestFrom: Position | null = null;
  let bestTo: Position | null = null;

  // Iterative deepening: start at depth 1, go deeper while time allows
  for (let depth = 1; depth <= 8; depth++) {
    try {
      const orderedMoves = orderMoves(gameState, rawMoves, bestFrom, bestTo);
      let iterBestScore = Number.NEGATIVE_INFINITY;
      let iterBestFrom: Position | null = null;
      let iterBestTo: Position | null = null;

      for (const { from, to } of orderedMoves) {
        const piece = gameState.board[from.row][from.col];
        const isPromo =
          piece?.type === "Pawn" && (to.row === 0 || to.row === 7);
        const next = applyMove(
          gameState,
          from,
          to,
          isPromo ? "Queen" : undefined,
        );
        const score = -negamax(
          next,
          depth - 1,
          Number.NEGATIVE_INFINITY,
          Number.POSITIVE_INFINITY,
          ctx,
        );

        if (score > iterBestScore) {
          iterBestScore = score;
          iterBestFrom = from;
          iterBestTo = to;
        }
      }

      // Completed iteration — save best move
      if (iterBestFrom && iterBestTo) {
        bestFrom = iterBestFrom;
        bestTo = iterBestTo;
      }

      // If we found a forced checkmate, stop early
      if (iterBestScore >= CHECKMATE_SCORE) break;

      // Check if time expired between iterations
      if (Date.now() >= deadline) break;
    } catch (e) {
      if (e instanceof SearchTimeout) {
        // Time ran out mid-search — use best move from last completed iteration
        break;
      }
      throw e;
    }
  }

  // Fall back to first legal move if somehow bestFrom is null
  if (!bestFrom || !bestTo) {
    const first = rawMoves[0];
    bestFrom = first.from;
    bestTo = first.to;
  }

  const piece = gameState.board[bestFrom.row][bestFrom.col];
  if (!piece) return null;

  const captured = gameState.board[bestTo.row][bestTo.col] ?? undefined;
  const isPromotion =
    piece.type === "Pawn" && (bestTo.row === 0 || bestTo.row === 7);
  const isCastle =
    piece.type === "King" &&
    !piece.hasMoved &&
    Math.abs(bestTo.col - bestFrom.col) === 2
      ? bestTo.col === 6
        ? ("kingside" as const)
        : ("queenside" as const)
      : undefined;

  const move: Move = {
    from: bestFrom,
    to: bestTo,
    piece,
    captured,
    promotion: isPromotion ? "Queen" : undefined,
    isCastle,
    isPromotion,
  };

  return move;
}
