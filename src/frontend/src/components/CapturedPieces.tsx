import { getPieceSymbol } from "@/lib/chess";
import type { GameState, Piece, PieceType } from "@/types/chess";

// Standard piece values for material advantage calculation
const PIECE_VALUES: Record<PieceType, number> = {
  Queen: 9,
  Rook: 5,
  Bishop: 3,
  Knight: 3,
  Pawn: 1,
  King: 0,
};

function calcMaterial(pieces: Piece[]): number {
  return pieces.reduce((sum, p) => sum + PIECE_VALUES[p.type], 0);
}

interface CapturedRowProps {
  label: string;
  pieces: Piece[];
  advantage: number;
}

function CapturedRow({ label, pieces, advantage }: CapturedRowProps) {
  return (
    <div
      className="flex items-center gap-2 min-h-[28px]"
      data-ocid={`captured-${label}`}
    >
      <span className="text-xs text-muted-foreground font-display uppercase tracking-wider w-10 flex-shrink-0">
        {label}
      </span>
      <div className="flex flex-wrap gap-0.5 flex-1 min-w-0">
        {pieces.length === 0 ? (
          <span className="text-xs text-muted-foreground/40 italic font-body">
            —
          </span>
        ) : (
          pieces.map((p, i) => (
            <span
              key={`${label}-${p.type}-${i}`}
              className={`text-lg leading-none ${p.color === "White" ? "piece-white" : "piece-black"}`}
              aria-label={`${p.color} ${p.type}`}
            >
              {getPieceSymbol(p)}
            </span>
          ))
        )}
      </div>
      {advantage > 0 && (
        <span className="text-xs font-display font-semibold text-secondary ml-1 flex-shrink-0">
          +{advantage}
        </span>
      )}
    </div>
  );
}

interface CapturedPiecesProps {
  gameState: GameState;
}

export function CapturedPieces({ gameState }: CapturedPiecesProps) {
  const { capturedByWhite, capturedByBlack } = gameState;

  const whiteMaterial = calcMaterial(capturedByWhite);
  const blackMaterial = calcMaterial(capturedByBlack);
  const whiteAdvantage = Math.max(0, whiteMaterial - blackMaterial);
  const blackAdvantage = Math.max(0, blackMaterial - whiteMaterial);

  return (
    <div className="space-y-1.5" data-ocid="captured-pieces">
      <CapturedRow
        label="White"
        pieces={capturedByWhite}
        advantage={whiteAdvantage}
      />
      <CapturedRow
        label="Black"
        pieces={capturedByBlack}
        advantage={blackAdvantage}
      />
    </div>
  );
}
