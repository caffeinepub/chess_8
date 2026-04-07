import { Badge } from "@/components/ui/badge";
import type { GameState } from "@/types/chess";
import { AlertTriangle, Crown, Minus } from "lucide-react";

function turnLabel(turn: GameState["currentTurn"]): string {
  return turn === "White" ? "White's Turn" : "Black's Turn";
}

function statusMessage(gameState: GameState): {
  text: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  icon?: React.ReactNode;
} {
  switch (gameState.status) {
    case "check":
      return {
        text: "Check!",
        variant: "destructive",
        icon: <AlertTriangle className="w-3 h-3" />,
      };
    case "checkmate":
      return {
        text: `${gameState.winner} wins by checkmate`,
        variant: "default",
        icon: <Crown className="w-3 h-3" />,
      };
    case "stalemate":
      return {
        text: "Stalemate — Draw",
        variant: "secondary",
        icon: <Minus className="w-3 h-3" />,
      };
    case "draw-threefold":
      return {
        text: "Draw — Threefold Repetition",
        variant: "secondary",
        icon: <Minus className="w-3 h-3" />,
      };
    case "draw-fifty":
      return {
        text: "Draw — 50-Move Rule",
        variant: "secondary",
        icon: <Minus className="w-3 h-3" />,
      };
    case "draw-insufficient":
      return {
        text: "Draw — Insufficient Material",
        variant: "secondary",
        icon: <Minus className="w-3 h-3" />,
      };
    case "resigned":
      return {
        text: `${gameState.winner} wins by resignation`,
        variant: "default",
        icon: <Crown className="w-3 h-3" />,
      };
    default:
      return {
        text: turnLabel(gameState.currentTurn),
        variant: gameState.currentTurn === "White" ? "outline" : "secondary",
      };
  }
}

interface GameStatusProps {
  gameState: GameState;
}

export function GameStatus({ gameState }: GameStatusProps) {
  const { text, variant, icon } = statusMessage(gameState);
  const isPlaying =
    gameState.status === "playing" || gameState.status === "check";
  const isGameOver = !isPlaying;
  const turnNumber =
    gameState.moveHistory.length > 0
      ? gameState.moveHistory[gameState.moveHistory.length - 1].moveNumber
      : 1;

  return (
    <output
      className="flex items-center gap-2"
      data-ocid="game-status"
      aria-label={text}
    >
      {/* Turn color indicator dot */}
      {isPlaying && (
        <span
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 border border-border ${
            gameState.currentTurn === "White"
              ? "bg-foreground"
              : "bg-muted-foreground"
          } ${gameState.status === "playing" ? "turn-indicator" : ""}`}
          aria-hidden="true"
        />
      )}
      {isGameOver && (
        <span className="text-secondary flex-shrink-0" aria-hidden="true">
          <Crown className="w-4 h-4" />
        </span>
      )}

      <Badge
        variant={variant}
        className={`gap-1 font-display text-xs px-2.5 py-0.5 ${
          isGameOver ? "ring-1 ring-secondary/40" : ""
        }`}
      >
        {icon}
        {text}
      </Badge>

      {isPlaying && (
        <span className="text-xs text-muted-foreground font-mono tabular-nums">
          Move {turnNumber}
        </span>
      )}
    </output>
  );
}
