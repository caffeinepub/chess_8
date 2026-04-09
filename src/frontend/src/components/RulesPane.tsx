import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "chess-rules-pane-visible";

interface RuleSection {
  title: string;
  content: string[];
}

const RULES: RuleSection[] = [
  {
    title: "Objective",
    content: [
      "Checkmate your opponent's King — put it under attack with no legal escape. The player who achieves checkmate wins the game.",
    ],
  },
  {
    title: "The Board",
    content: [
      "Chess is played on an 8×8 grid of 64 squares, alternating between light and dark. Files run vertically (a–h), ranks run horizontally (1–8).",
      "Each player starts with 16 pieces: 1 King, 1 Queen, 2 Rooks, 2 Bishops, 2 Knights, and 8 Pawns.",
    ],
  },
  {
    title: "The Pieces",
    content: [
      "♔ King — moves one square in any direction. Must never move into check.",
      "♕ Queen — the most powerful piece. Moves any number of squares in any direction (horizontal, vertical, or diagonal).",
      "♖ Rook — moves any number of squares horizontally or vertically. Essential for castling.",
      "♗ Bishop — moves any number of squares diagonally. Each bishop stays on one colour throughout the game.",
      "♘ Knight — moves in an L-shape: two squares in one direction then one square perpendicular. The only piece that can jump over others.",
      "♙ Pawn — moves forward one square, or two squares from its starting position. Captures diagonally one square forward.",
    ],
  },
  {
    title: "Special Moves",
    content: [
      "Castling — Once per game the King can castle with a Rook: the King moves two squares toward the Rook, then the Rook jumps to the other side. Requirements: neither piece has moved, no pieces between them, the King is not in check and does not pass through check.",
      "En Passant — If a Pawn advances two squares from its starting rank and lands beside an opponent's Pawn, that opponent may capture it as if it had moved only one square. The capture must be made immediately on the next move.",
      "Pawn Promotion — When a Pawn reaches the opposite end of the board (rank 8 for White, rank 1 for Black), it must be promoted to any other piece (Queen, Rook, Bishop, or Knight). Promoting to a Queen is most common.",
    ],
  },
  {
    title: "Check & Checkmate",
    content: [
      "Check — The King is in check when it is under direct attack by an opponent's piece. The player in check must resolve it immediately by: moving the King, blocking the attack, or capturing the attacking piece.",
      "Checkmate — The King is in check with no legal move to escape. The game ends immediately and the player who delivered checkmate wins.",
    ],
  },
  {
    title: "Draws",
    content: [
      "Stalemate — The player to move has no legal moves and their King is not in check. The game is a draw.",
      "Insufficient Material — Neither player has enough pieces to force checkmate (e.g. King vs King, King + Bishop vs King). The game is drawn.",
      "Threefold Repetition — If the same position occurs three times with the same player to move, a draw can be claimed.",
      "50-Move Rule — If 50 consecutive moves pass without a pawn move or capture, either player may claim a draw.",
      "Mutual Agreement — Both players may agree to a draw at any time during play.",
    ],
  },
  {
    title: "Turn Order & Time",
    content: [
      "White always moves first. Players alternate turns, moving exactly one piece per turn (castling counts as one move).",
      "In timed games, each player has a clock that runs during their turn. Running out of time is a loss, unless the opponent lacks sufficient material to checkmate.",
    ],
  },
  {
    title: "Notation (Basics)",
    content: [
      "Algebraic notation records each move by piece letter + destination square. Pawns have no letter prefix (e.g. e4). Captures use × (e.g. Bxf6). Check is + and checkmate is #.",
      "Castling kingside is written O-O; queenside is O-O-O.",
    ],
  },
];

export function RulesPane() {
  const [visible, setVisible] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === null ? true : stored === "true";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(visible));
    } catch {
      // ignore
    }
  }, [visible]);

  return (
    <div className="relative flex h-full">
      {/* Pane content */}
      {visible && (
        <div className="w-52 xl:w-60 flex flex-col h-full bg-card border-r border-border">
          {/* Pane header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="font-display font-semibold text-xs tracking-wide text-foreground uppercase">
                Rules of Chess
              </span>
            </div>
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="flex items-center justify-center w-6 h-6 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Hide rules pane"
              data-ocid="rules-pane-hide"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scrollable rules content */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-3 py-3 space-y-4">
              {RULES.map((section) => (
                <div key={section.title}>
                  <h3 className="font-display font-semibold text-[11px] uppercase tracking-widest text-primary mb-1.5">
                    {section.title}
                  </h3>
                  <ul className="space-y-1.5">
                    {section.content.map((line) => (
                      <li
                        key={line.slice(0, 40)}
                        className="text-[11px] leading-relaxed text-muted-foreground"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Toggle tab — always visible */}
      {!visible && (
        <button
          type="button"
          onClick={() => setVisible(true)}
          className="flex flex-col items-center justify-center gap-1.5 w-7 h-full bg-card border-r border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground group"
          aria-label="Show rules pane"
          data-ocid="rules-pane-show"
        >
          <ChevronRight className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
          <span
            className="font-display font-semibold text-[9px] uppercase tracking-widest"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            Rules
          </span>
          <BookOpen className="w-3 h-3 group-hover:text-primary transition-colors" />
        </button>
      )}
    </div>
  );
}
