import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getPieceSymbol } from "@/lib/chess";
import type { PieceColor, PieceType } from "@/types/chess";

const PROMOTION_PIECES: { type: PieceType; label: string }[] = [
  { type: "Queen", label: "Queen" },
  { type: "Rook", label: "Rook" },
  { type: "Bishop", label: "Bishop" },
  { type: "Knight", label: "Knight" },
];

interface PromotionModalProps {
  color: PieceColor;
  onSelect: (piece: PieceType) => void;
}

export function PromotionModal({ color, onSelect }: PromotionModalProps) {
  return (
    <Dialog open>
      <DialogContent
        className="bg-card border-border max-w-xs"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        data-ocid="promotion-modal"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-center text-base">
            Promote Pawn
          </DialogTitle>
          <p className="text-xs text-muted-foreground text-center font-body">
            Choose a piece for promotion
          </p>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-2 pt-2">
          {PROMOTION_PIECES.map(({ type, label }) => (
            <button
              key={type}
              type="button"
              className="flex flex-col items-center gap-1.5 p-3 rounded-md bg-muted hover:bg-accent/20 transition-all duration-150 border border-transparent hover:border-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring group"
              onClick={() => onSelect(type)}
              data-ocid={`promo-${type.toLowerCase()}`}
              aria-label={`Promote to ${label}`}
            >
              <span
                className={`text-4xl leading-none select-none transition-transform duration-150 group-hover:scale-110 ${color === "White" ? "piece-white" : "piece-black"}`}
              >
                {getPieceSymbol({ type, color })}
              </span>
              <span className="text-xs text-muted-foreground font-display group-hover:text-secondary transition-colors duration-150">
                {label}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
