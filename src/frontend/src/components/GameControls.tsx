import { Button } from "@/components/ui/button";
import type { GameState } from "@/types/chess";
import { Flag, Handshake, RotateCcw, Undo2 } from "lucide-react";

interface GameControlsProps {
  gameState: GameState;
  onNewGame: () => void;
  onResign: () => void;
  onOfferDraw: () => void;
  onClaimDraw: () => void;
  onUndo: () => void;
  drawOffer?: "White" | "Black" | null;
}

export function GameControls({
  gameState,
  onNewGame,
  onResign,
  onOfferDraw,
  onClaimDraw,
  onUndo,
  drawOffer,
}: GameControlsProps) {
  const isGameOver =
    gameState.status !== "playing" && gameState.status !== "check";

  // Can claim draw by threefold repetition or 50-move rule
  const canClaimDraw =
    !isGameOver &&
    (gameState.status === "draw-threefold" ||
      gameState.status === "draw-fifty" ||
      gameState.halfMoveClock >= 100 ||
      gameState.positionHistory.filter(
        (p) =>
          p === gameState.positionHistory[gameState.positionHistory.length - 1],
      ).length >= 3);

  const canUndo = !isGameOver && gameState.moves.length >= 2;
  const drawAlreadyOffered = drawOffer === gameState.currentTurn;

  return (
    <div
      className="flex items-center justify-between px-4 py-3 gap-2 flex-wrap"
      data-ocid="game-controls"
    >
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onResign}
          disabled={isGameOver}
          className="gap-1.5 font-display text-xs"
          data-ocid="btn-resign"
          aria-label="Resign game"
        >
          <Flag className="w-3.5 h-3.5" />
          Resign
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={drawAlreadyOffered ? onClaimDraw : onOfferDraw}
          disabled={isGameOver || (!canClaimDraw && !drawAlreadyOffered)}
          className="gap-1.5 font-display text-xs"
          data-ocid="btn-draw"
          title={
            canClaimDraw
              ? "Claim draw by repetition or 50-move rule"
              : drawAlreadyOffered
                ? "Draw offered — claim if opponent agrees"
                : "Offer draw to opponent"
          }
          aria-label={canClaimDraw ? "Claim draw" : "Offer draw"}
        >
          <Handshake className="w-3.5 h-3.5" />
          {canClaimDraw
            ? "Claim Draw"
            : drawAlreadyOffered
              ? "Offered…"
              : "Draw"}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          className="gap-1.5 font-display text-xs text-muted-foreground hover:text-foreground"
          data-ocid="btn-undo"
          aria-label="Undo last full move"
        >
          <Undo2 className="w-3.5 h-3.5" />
          Undo
        </Button>
      </div>

      <Button
        variant="default"
        size="sm"
        onClick={onNewGame}
        className="gap-1.5 font-display text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80"
        data-ocid="btn-new-game"
        aria-label="Start new game"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        New Game
      </Button>
    </div>
  );
}
