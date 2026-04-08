/**
 * Chess AI Engine — minimax with alpha-beta pruning
 *
 * getBestMove(gameState, depth) → Move | null
 *
 * Evaluation: material values + piece-square tables + mobility bonus
 * Move ordering: captures sorted by MVV-LVA, then check-giving moves
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
  // White reads the table top-to-bottom as rows 7→0 (flip vertically)
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

// ─── Move Ordering (MVV-LVA + check bonus) ───────────────────────────────────

function mvvLvaScore(board: BoardState, from: Position, to: Position): number {
  const attacker = board[from.row][from.col];
  const victim = board[to.row][to.col];
  if (!attacker) return 0;
  if (!victim) return 0; // not a capture
  // Higher victim value and lower attacker value → higher priority
  return PIECE_VALUE[victim.type] * 10 - PIECE_VALUE[attacker.type];
}

function orderMoves(
  state: GameState,
  moves: Array<{ from: Position; to: Position }>,
): Array<{ from: Position; to: Position }> {
  return [...moves].sort((a, b) => {
    const scoreB = mvvLvaScore(state.board, b.from, b.to);
    const scoreA = mvvLvaScore(state.board, a.from, a.to);
    return scoreB - scoreA; // descending — best captures first
  });
}

// ─── Minimax with Alpha-Beta Pruning ─────────────────────────────────────────

const CHECKMATE_SCORE = 100000;

function minimaxMax(
  state: GameState,
  depth: number,
  alphaIn: number,
  beta: number,
): number {
  if (depth === 0 || isTerminal(state)) return terminalOrEval(state, depth);

  const rawMoves = enumerateMoves(state);
  if (rawMoves.length === 0) return evaluate(state);

  let alpha = alphaIn;
  let best = Number.NEGATIVE_INFINITY;
  for (const { from, to } of orderMoves(state, rawMoves)) {
    const piece = state.board[from.row][from.col];
    const isPromo = piece?.type === "Pawn" && (to.row === 0 || to.row === 7);
    const next = applyMove(state, from, to, isPromo ? "Queen" : undefined);
    const score = minimaxMin(next, depth - 1, alpha, beta);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break; // β cutoff
  }
  return best;
}

function minimaxMin(
  state: GameState,
  depth: number,
  alpha: number,
  betaIn: number,
): number {
  if (depth === 0 || isTerminal(state)) return terminalOrEval(state, depth);

  const rawMoves = enumerateMoves(state);
  if (rawMoves.length === 0) return evaluate(state);

  let beta = betaIn;
  let best = Number.POSITIVE_INFINITY;
  for (const { from, to } of orderMoves(state, rawMoves)) {
    const piece = state.board[from.row][from.col];
    const isPromo = piece?.type === "Pawn" && (to.row === 0 || to.row === 7);
    const next = applyMove(state, from, to, isPromo ? "Queen" : undefined);
    const score = minimaxMax(next, depth - 1, alpha, beta);
    if (score < best) best = score;
    if (best < beta) beta = best;
    if (alpha >= beta) break; // α cutoff
  }
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

function terminalOrEval(state: GameState, depth: number): number {
  if (state.status === "checkmate") {
    // The side that just moved delivered checkmate; current turn is the loser
    return state.currentTurn === "White"
      ? -CHECKMATE_SCORE - depth
      : CHECKMATE_SCORE + depth;
  }
  if (isTerminal(state)) return 0;
  return evaluate(state);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the best move for the current player given the game state.
 * Returns null if there are no legal moves (checkmate / stalemate).
 *
 * Depth mapping for callers:
 *   difficulty 1 → depth 2
 *   difficulty 2 → depth 3
 *   difficulty 3 → depth 4
 *   difficulty 4 → depth 5
 *   difficulty 5 → depth 6
 */
export function getBestMove(gameState: GameState, depth: number): Move | null {
  const rawMoves = enumerateMoves(gameState);
  if (rawMoves.length === 0) return null;

  const orderedMoves = orderMoves(gameState, rawMoves);
  const maximizing = gameState.currentTurn === "White";

  let bestScore = maximizing
    ? Number.NEGATIVE_INFINITY
    : Number.POSITIVE_INFINITY;
  let bestFrom: Position | null = null;
  let bestTo: Position | null = null;

  for (const { from, to } of orderedMoves) {
    const piece = gameState.board[from.row][from.col];
    const isPromo = piece?.type === "Pawn" && (to.row === 0 || to.row === 7);
    const next = applyMove(gameState, from, to, isPromo ? "Queen" : undefined);
    const score = maximizing
      ? minimaxMin(
          next,
          depth - 1,
          Number.NEGATIVE_INFINITY,
          Number.POSITIVE_INFINITY,
        )
      : minimaxMax(
          next,
          depth - 1,
          Number.NEGATIVE_INFINITY,
          Number.POSITIVE_INFINITY,
        );

    if (maximizing ? score > bestScore : score < bestScore) {
      bestScore = score;
      bestFrom = from;
      bestTo = to;
    }
  }

  if (!bestFrom || !bestTo) return null;

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
