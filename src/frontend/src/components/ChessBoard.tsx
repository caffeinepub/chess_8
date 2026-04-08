import { getPieceSymbol } from "@/lib/chess";
import type { BoardState, Move, Position } from "@/types/chess";
import type React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChessBoardProps {
  board: BoardState;
  selectedSquare: Position | null;
  /** Positions the selected piece can legally move to */
  validMoveTargets: Position[];
  lastMove: Move | null;
  isInCheck: boolean;
  checkKingPosition: Position | null;
  onSquareClick: (pos: Position) => void;
  isFlipped: boolean;
  isDisabled?: boolean;
  engineThinking?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

// ─── Square Utilities ─────────────────────────────────────────────────────────

function posEq(a: Position | null | undefined, b: Position): boolean {
  return a !== null && a !== undefined && a.row === b.row && a.col === b.col;
}

// ─── Board Square ─────────────────────────────────────────────────────────────

interface SquareCellProps {
  row: number;
  col: number;
  board: BoardState;
  selectedSquare: Position | null;
  validMoveTargets: Position[];
  lastMove: Move | null;
  isInCheck: boolean;
  checkKingPosition: Position | null;
  onSquareClick: (pos: Position) => void;
  isDisabled: boolean;
}

function SquareCell({
  row,
  col,
  board,
  selectedSquare,
  validMoveTargets,
  lastMove,
  isInCheck,
  checkKingPosition,
  onSquareClick,
  isDisabled,
}: SquareCellProps) {
  const piece = board[row][col];
  const isLight = (row + col) % 2 === 0;

  const isSelected = posEq(selectedSquare, { row, col });

  const isLegalTarget = validMoveTargets.some(
    (p) => p.row === row && p.col === col,
  );
  const hasCapturablePiece = isLegalTarget && !!piece;

  const isLastMoveFrom = lastMove ? posEq(lastMove.from, { row, col }) : false;
  const isLastMoveTo = lastMove ? posEq(lastMove.to, { row, col }) : false;
  const isLastMove = isLastMoveFrom || isLastMoveTo;

  const isCheckSquare =
    isInCheck && checkKingPosition
      ? posEq(checkKingPosition, { row, col })
      : false;

  // Build class list for the square background
  const baseClass = isLight ? "board-square-light" : "board-square-dark";

  let stateClass = "";
  if (isSelected) {
    stateClass = "board-square-selected";
  } else if (isCheckSquare) {
    stateClass = "board-square-check";
  } else if (isLastMove) {
    stateClass = "board-square-last-move";
  }

  const legalClass =
    isLegalTarget && !hasCapturablePiece ? "board-square-legal" : "";
  const captureClass = hasCapturablePiece ? "board-square-legal-capture" : "";

  const squareClass = [baseClass, stateClass, legalClass, captureClass]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={`relative flex items-center justify-center transition-all duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${squareClass} ${isDisabled ? "cursor-default" : "cursor-pointer"}`}
      onClick={() => onSquareClick({ row, col })}
      aria-label={`${FILES[col]}${row + 1}${piece ? ` ${piece.color} ${piece.type}` : ""}`}
      data-ocid={`sq-${FILES[col]}${row + 1}`}
      style={
        {
          width: "var(--sq, 62px)",
          height: "var(--sq, 62px)",
        } as React.CSSProperties
      }
    >
      {piece && (
        <span
          className={`leading-none select-none z-20 relative transition-transform duration-100 ${
            isSelected ? "scale-110" : "hover:scale-105"
          } ${piece.color === "White" ? "piece-white" : "piece-black"}`}
          style={{ fontSize: "calc(var(--sq, 62px) * 0.72)" }}
        >
          {getPieceSymbol(piece)}
        </span>
      )}
    </button>
  );
}

// ─── ChessBoard ───────────────────────────────────────────────────────────────

export function ChessBoard({
  board,
  selectedSquare,
  validMoveTargets,
  lastMove,
  isInCheck,
  checkKingPosition,
  onSquareClick,
  isFlipped,
  isDisabled = false,
  engineThinking = false,
}: ChessBoardProps) {
  // Determine row/col render order based on flip state
  const rows = isFlipped ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const cols = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  const handleSquareClick = (pos: Position) => {
    if (!isDisabled) onSquareClick(pos);
  };

  return (
    <div className="flex flex-col items-center select-none">
      <div className="flex">
        {/* Rank labels (1–8) */}
        <div className="flex flex-col justify-around mr-1 pb-6">
          {rows.map((row) => (
            <span
              key={row}
              className="text-xs text-muted-foreground w-4 text-center font-mono leading-none"
              style={{ height: "var(--sq, 62px)" } as React.CSSProperties}
            >
              {row + 1}
            </span>
          ))}
        </div>

        <div>
          {/* Board grid */}
          <div
            className={`grid shadow-board rounded-sm overflow-hidden border border-border/30 transition-opacity duration-300 ${engineThinking ? "opacity-80" : ""}`}
            style={
              {
                gridTemplateColumns: "repeat(8, var(--sq, 62px))",
                gridTemplateRows: "repeat(8, var(--sq, 62px))",
              } as React.CSSProperties
            }
            data-ocid="chess-board"
          >
            {rows.map((row) =>
              cols.map((col) => (
                <SquareCell
                  key={`${row}-${col}`}
                  row={row}
                  col={col}
                  board={board}
                  selectedSquare={selectedSquare}
                  validMoveTargets={validMoveTargets}
                  lastMove={lastMove}
                  isInCheck={isInCheck}
                  checkKingPosition={checkKingPosition}
                  onSquareClick={handleSquareClick}
                  isDisabled={isDisabled}
                />
              )),
            )}
          </div>

          {/* File labels (a–h) */}
          <div className="flex mt-1">
            {cols.map((col) => (
              <span
                key={col}
                className="text-xs text-muted-foreground text-center font-mono"
                style={{ width: "var(--sq, 62px)" } as React.CSSProperties}
              >
                {FILES[col]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChessBoard;
