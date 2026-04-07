import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Crown, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import { Layout, StatusBadge } from "./Layout";
import { GameControls } from "./components/GameControls";
import { MoveHistory } from "./components/MoveHistory";
import {
  applyMove,
  createInitialGameState,
  getLegalMoves,
  getPieceSymbol,
} from "./lib/chess";
import type { GameState, PieceColor, PieceType, Position } from "./types/chess";

// ─── Clock ────────────────────────────────────────────────────────────────────

const INITIAL_TIME = 10 * 60;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function useClock(gameState: GameState) {
  const [whiteTime, setWhiteTime] = useState(INITIAL_TIME);
  const [blackTime, setBlackTime] = useState(INITIAL_TIME);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isGameOver =
    gameState.status !== "playing" && gameState.status !== "check";
  const currentTurn = gameState.currentTurn;

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isGameOver) return;
    intervalRef.current = setInterval(() => {
      if (currentTurn === "White") {
        setWhiteTime((t) => Math.max(0, t - 1));
      } else {
        setBlackTime((t) => Math.max(0, t - 1));
      }
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentTurn, isGameOver]);

  const resetClocks = useCallback(() => {
    setWhiteTime(INITIAL_TIME);
    setBlackTime(INITIAL_TIME);
  }, []);

  return { whiteTime, blackTime, resetClocks };
}

// ─── Board Component ──────────────────────────────────────────────────────────

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

interface BoardProps {
  gameState: GameState;
  onSquareClick: (pos: Position) => void;
  lastMove?: { from: Position; to: Position };
}

function ChessBoard({ gameState, onSquareClick, lastMove }: BoardProps) {
  const { board, selectedSquare, legalMovesForSelected, currentTurn, status } =
    gameState;

  const rows = [7, 6, 5, 4, 3, 2, 1, 0];
  const cols = [0, 1, 2, 3, 4, 5, 6, 7];

  const isLegalTarget = (row: number, col: number) =>
    legalMovesForSelected.some((m) => m.row === row && m.col === col);

  const isSelected = (row: number, col: number) =>
    selectedSquare?.row === row && selectedSquare?.col === col;

  const isLastMove = (row: number, col: number) =>
    lastMove &&
    ((lastMove.from.row === row && lastMove.from.col === col) ||
      (lastMove.to.row === row && lastMove.to.col === col));

  const isKingInCheck = (row: number, col: number) => {
    const piece = board[row][col];
    if (!piece || piece.type !== "King") return false;
    if (status !== "check" && status !== "checkmate") return false;
    return piece.color === currentTurn;
  };

  const isDisabled = status !== "playing" && status !== "check";

  return (
    <div className="flex flex-col items-center select-none">
      <div className="flex">
        <div className="flex flex-col justify-around mr-1 pb-6">
          {rows.map((row) => (
            <span
              key={row}
              className="text-xs text-muted-foreground w-4 text-center font-mono leading-none"
              style={{ height: "var(--sq, 62px)" }}
            >
              {row + 1}
            </span>
          ))}
        </div>

        <div>
          <div
            className="grid shadow-board rounded-sm overflow-hidden border border-border/30"
            style={
              {
                gridTemplateColumns: "repeat(8, var(--sq, 62px))",
                gridTemplateRows: "repeat(8, var(--sq, 62px))",
              } as React.CSSProperties
            }
            data-ocid="chess-board"
          >
            {rows.map((row) =>
              cols.map((col) => {
                const piece = board[row][col];
                const isLight = (row + col) % 2 === 0;
                const legal = isLegalTarget(row, col);
                const selected = isSelected(row, col);
                const lastMv = isLastMove(row, col);
                const inCheck = isKingInCheck(row, col);
                const hasCapturablePiece = legal && !!piece;

                const baseClass = isLight
                  ? "board-square-light"
                  : "board-square-dark";
                const overlayClasses = [
                  selected
                    ? "board-square-selected"
                    : lastMv
                      ? "board-square-last-move"
                      : "",
                  inCheck ? "board-square-check" : "",
                  legal && !hasCapturablePiece ? "board-square-legal" : "",
                  hasCapturablePiece ? "board-square-legal-capture" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                const squareClass = `${baseClass} ${overlayClasses}`.trim();

                return (
                  <button
                    type="button"
                    key={`${row}-${col}`}
                    className={`relative flex items-center justify-center cursor-pointer transition-all duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${squareClass} ${isDisabled ? "cursor-default" : ""}`}
                    onClick={() => !isDisabled && onSquareClick({ row, col })}
                    aria-label={`${FILES[col]}${row + 1}${piece ? ` ${piece.color} ${piece.type}` : ""}`}
                    data-ocid={`sq-${FILES[col]}${row + 1}`}
                  >
                    {piece && (
                      <span
                        className={`leading-none select-none z-20 relative transition-transform duration-100 ${selected ? "scale-110" : "hover:scale-105"} ${piece.color === "White" ? "piece-white" : "piece-black"}`}
                        style={{ fontSize: "calc(var(--sq, 62px) * 0.72)" }}
                      >
                        {getPieceSymbol(piece)}
                      </span>
                    )}
                  </button>
                );
              }),
            )}
          </div>

          <div className="flex mt-1">
            {cols.map((col) => (
              <span
                key={col}
                className="text-xs text-muted-foreground text-center font-mono"
                style={{ width: "var(--sq, 62px)" }}
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

// ─── Promotion Dialog ─────────────────────────────────────────────────────────

const PROMO_PIECES: PieceType[] = ["Queen", "Rook", "Bishop", "Knight"];

interface PromotionDialogProps {
  color: PieceColor;
  onSelect: (piece: PieceType) => void;
}

function PromotionDialog({ color, onSelect }: PromotionDialogProps) {
  return (
    <Dialog open>
      <DialogContent className="bg-card border-border max-w-xs">
        <DialogHeader>
          <DialogTitle className="font-display text-center">
            Choose Promotion
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-2 pt-2">
          {PROMO_PIECES.map((pt) => (
            <button
              type="button"
              key={pt}
              className="flex flex-col items-center gap-1 p-3 rounded-md bg-muted hover:bg-accent/20 transition-colors border border-transparent hover:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onSelect(pt)}
              data-ocid={`promo-${pt.toLowerCase()}`}
            >
              <span
                className={`text-4xl ${color === "White" ? "piece-white" : "piece-black"}`}
              >
                {getPieceSymbol({ type: pt, color })}
              </span>
              <span className="text-xs text-muted-foreground font-display">
                {pt}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  gameState: GameState;
  whiteTime: number;
  blackTime: number;
}

const CLOCK_COLORS: PieceColor[] = ["Black", "White"];

function Sidebar({ gameState, whiteTime, blackTime }: SidebarProps) {
  const { capturedByWhite, capturedByBlack, currentTurn, status } = gameState;
  const isPlaying = status === "playing" || status === "check";

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto">
      <div className="grid grid-cols-1 gap-3">
        {CLOCK_COLORS.map((color) => {
          const isActive = isPlaying && currentTurn === color;
          const time = color === "White" ? whiteTime : blackTime;
          const isLow = time < 60;
          return (
            <div
              key={color}
              className={`rounded-md px-4 py-3 border transition-all duration-300 ${isActive ? "bg-muted border-primary/40 clock-active" : "bg-muted/40 border-border"}`}
              data-ocid={`clock-${color.toLowerCase()}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-display uppercase tracking-wider">
                  {color}
                </span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-primary turn-indicator" />
                )}
              </div>
              <span
                className={`font-display font-bold text-2xl tabular-nums tracking-tight ${isLow && isActive ? "text-destructive" : "text-foreground"}`}
              >
                {formatTime(time)}
              </span>
            </div>
          );
        })}
      </div>

      <Separator />

      <div>
        <h3 className="text-xs font-display font-semibold text-muted-foreground tracking-widest uppercase mb-2">
          Captured
        </h3>
        <div className="space-y-1.5">
          {[
            { label: "white", pieces: capturedByWhite },
            { label: "black", pieces: capturedByBlack },
          ].map(({ label, pieces }) => (
            <div key={label} className="min-h-[28px]">
              {pieces.length > 0 && (
                <div
                  className="flex flex-wrap gap-0.5"
                  data-ocid="captured-pieces"
                >
                  {pieces.map((p, i) => (
                    <span
                      key={`${label}-${p.type}-${i}`}
                      className={`text-xl ${p.color === "White" ? "piece-white" : "piece-black"}`}
                      style={{ textShadow: "none" }}
                    >
                      {getPieceSymbol(p)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-xs font-display font-semibold text-muted-foreground tracking-widest uppercase mb-2">
          50-Move Rule
        </h3>
        <p className="text-sm text-foreground font-mono">
          {gameState.halfMoveClock} / 100
        </p>
      </div>
    </div>
  );
}

// ─── Controls ─────────────────────────────────────────────────────────────────

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ gameState }: { gameState: GameState }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2">
        <Crown className="w-5 h-5 text-secondary" />
        <span className="font-display font-bold text-base tracking-tight text-foreground">
          Grandmaster Chess
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm font-body">
        <span className="text-foreground font-semibold">Player White</span>
        <span className="text-muted-foreground text-xs">vs</span>
        <span className="text-muted-foreground font-semibold">
          Player Black
        </span>
      </div>

      <StatusBadge
        status={gameState.status}
        currentTurn={gameState.currentTurn}
        winner={gameState.winner}
      />
    </div>
  );
}

// ─── Game Over Dialog ─────────────────────────────────────────────────────────

function GameOverDialog({
  gameState,
  onNewGame,
}: { gameState: GameState; onNewGame: () => void }) {
  const isGameOver =
    gameState.status !== "playing" && gameState.status !== "check";
  if (!isGameOver) return null;

  const messages: Partial<Record<GameState["status"], string>> = {
    checkmate: `Checkmate! ${gameState.winner} wins!`,
    stalemate: "Stalemate — It's a draw!",
    "draw-threefold": "Draw by threefold repetition",
    "draw-fifty": "Draw by 50-move rule",
    "draw-insufficient": "Draw — insufficient material",
    resigned: `${gameState.winner} wins by resignation`,
  };

  return (
    <Dialog open>
      <DialogContent className="bg-card border-border max-w-sm text-center">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <Crown className="w-12 h-12 text-secondary" />
          </div>
          <DialogTitle className="font-display text-xl">
            {messages[gameState.status] ?? "Game Over"}
          </DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm mb-4 font-body">
          {gameState.moves.length} moves played
        </p>
        <Button
          onClick={onNewGame}
          className="w-full font-display bg-secondary text-secondary-foreground hover:bg-secondary/80"
          data-ocid="btn-new-game-dialog"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Play Again
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState);
  const [lastMove, setLastMove] = useState<
    { from: Position; to: Position } | undefined
  >();
  const [prePromotionState, setPrePromotionState] = useState<GameState | null>(
    null,
  );
  const [pendingPromoMove, setPendingPromoMove] = useState<{
    from: Position;
    to: Position;
  } | null>(null);
  const [drawOffer, setDrawOffer] = useState<PieceColor | null>(null);
  // Keep a history stack for undo (each entry = full GameState before the move)
  const historyStackRef = useRef<GameState[]>([]);
  const { whiteTime, blackTime, resetClocks } = useClock(gameState);

  const handleSquareClick = useCallback((pos: Position) => {
    // Any move cancels a pending draw offer from the opponent
    setDrawOffer(null);
    setGameState((prev) => {
      if (prev.promotionPending) return prev;

      const { board, selectedSquare, currentTurn, enPassantTarget } = prev;
      const piece = board[pos.row][pos.col];

      if (!selectedSquare) {
        if (piece && piece.color === currentTurn) {
          const legal = getLegalMoves(board, pos, enPassantTarget);
          return { ...prev, selectedSquare: pos, legalMovesForSelected: legal };
        }
        return prev;
      }

      if (selectedSquare.row === pos.row && selectedSquare.col === pos.col) {
        return { ...prev, selectedSquare: null, legalMovesForSelected: [] };
      }

      if (piece && piece.color === currentTurn) {
        const legal = getLegalMoves(board, pos, enPassantTarget);
        return { ...prev, selectedSquare: pos, legalMovesForSelected: legal };
      }

      const isLegal = prev.legalMovesForSelected.some(
        (m) => m.row === pos.row && m.col === pos.col,
      );
      if (!isLegal) {
        return { ...prev, selectedSquare: null, legalMovesForSelected: [] };
      }

      const movingPiece = board[selectedSquare.row][selectedSquare.col];
      if (movingPiece?.type === "Pawn" && (pos.row === 0 || pos.row === 7)) {
        setPrePromotionState(prev);
        setPendingPromoMove({ from: selectedSquare, to: pos });
        setLastMove({ from: selectedSquare, to: pos });
        // Push to history before promotion
        historyStackRef.current = [...historyStackRef.current, prev];
        return {
          ...prev,
          promotionPending: pos,
          selectedSquare: null,
          legalMovesForSelected: [],
        };
      }

      // Push state before the move for undo support
      historyStackRef.current = [...historyStackRef.current, prev];
      const next = applyMove(prev, selectedSquare, pos);
      setLastMove({ from: selectedSquare, to: pos });
      return next;
    });
  }, []);

  const handlePromotion = useCallback(
    (piece: PieceType) => {
      if (!prePromotionState || !pendingPromoMove) return;
      const next = applyMove(
        prePromotionState,
        pendingPromoMove.from,
        pendingPromoMove.to,
        piece,
      );
      setGameState(next);
      setPrePromotionState(null);
      setPendingPromoMove(null);
    },
    [prePromotionState, pendingPromoMove],
  );

  const handleNewGame = useCallback(() => {
    setGameState(createInitialGameState());
    setLastMove(undefined);
    setPrePromotionState(null);
    setPendingPromoMove(null);
    setDrawOffer(null);
    historyStackRef.current = [];
    resetClocks();
  }, [resetClocks]);

  const handleResign = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      status: "resigned",
      winner: prev.currentTurn === "White" ? "Black" : "White",
    }));
    setDrawOffer(null);
  }, []);

  const handleOfferDraw = useCallback(() => {
    setGameState((prev) => {
      const isGameOver = prev.status !== "playing" && prev.status !== "check";
      if (isGameOver) return prev;
      return prev;
    });
    setDrawOffer((prev) => (prev ? null : gameState.currentTurn));
  }, [gameState.currentTurn]);

  const handleClaimDraw = useCallback(() => {
    setGameState((prev) => {
      const canClaim =
        prev.halfMoveClock >= 100 ||
        prev.positionHistory.filter(
          (p) => p === prev.positionHistory[prev.positionHistory.length - 1],
        ).length >= 3;
      if (!canClaim) return prev;
      return {
        ...prev,
        status: "draw-fifty",
        winner: undefined,
      };
    });
    setDrawOffer(null);
  }, []);

  const handleAcceptDraw = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      status: "stalemate",
      winner: undefined,
    }));
    setDrawOffer(null);
  }, []);

  const handleDeclineDraw = useCallback(() => {
    setDrawOffer(null);
  }, []);

  const handleUndo = useCallback(() => {
    const stack = historyStackRef.current;
    // Undo a full move = 2 half-moves; pop twice if possible
    if (stack.length < 2) return;
    const prevState = stack[stack.length - 2];
    historyStackRef.current = stack.slice(0, -2);
    setGameState(prevState);
    setLastMove(undefined);
    setDrawOffer(null);
  }, []);

  // promotionPending is set BEFORE the turn switches, so currentTurn IS the promoting player
  const promotionColor: PieceColor = gameState.promotionPending
    ? gameState.currentTurn
    : "White";

  // The opponent of whoever offered the draw is the one who must respond
  const drawOfferForCurrentPlayer =
    drawOffer !== null && drawOffer !== gameState.currentTurn;

  return (
    <>
      <Layout
        gameState={gameState}
        header={<Header gameState={gameState} />}
        board={
          <ChessBoard
            gameState={gameState}
            onSquareClick={handleSquareClick}
            lastMove={lastMove}
          />
        }
        sidebar={
          <Sidebar
            gameState={gameState}
            whiteTime={whiteTime}
            blackTime={blackTime}
          />
        }
        moveList={<MoveHistory gameState={gameState} />}
        controls={
          drawOfferForCurrentPlayer ? (
            <div
              className="flex items-center justify-between px-4 py-3 gap-3"
              data-ocid="draw-offer-controls"
            >
              <span className="text-sm font-body text-muted-foreground">
                <span className="text-foreground font-semibold">
                  {drawOffer}
                </span>{" "}
                offers a draw
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDeclineDraw}
                  className="font-display text-xs"
                  data-ocid="btn-decline-draw"
                >
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={handleAcceptDraw}
                  className="font-display text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  data-ocid="btn-accept-draw"
                >
                  Accept Draw
                </Button>
              </div>
            </div>
          ) : (
            <GameControls
              gameState={gameState}
              onNewGame={handleNewGame}
              onResign={handleResign}
              onOfferDraw={handleOfferDraw}
              onClaimDraw={handleClaimDraw}
              onUndo={handleUndo}
              drawOffer={drawOffer}
            />
          )
        }
      />

      {gameState.promotionPending && (
        <PromotionDialog color={promotionColor} onSelect={handlePromotion} />
      )}

      <GameOverDialog gameState={gameState} onNewGame={handleNewGame} />
    </>
  );
}
