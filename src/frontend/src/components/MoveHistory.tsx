import type { GameState } from "@/types/chess";
import { useEffect, useRef } from "react";

interface MoveHistoryProps {
  gameState: GameState;
  currentMoveIndex?: number;
}

export function MoveHistory({ gameState, currentMoveIndex }: MoveHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { moveHistory } = gameState;

  const lastIndex = moveHistory.length - 1;
  const activeMoveIdx =
    currentMoveIndex !== undefined ? currentMoveIndex : lastIndex;

  const moveCount = moveHistory.length;

  // Auto-scroll to the latest move whenever move count changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: moveCount is the stable primitive that tracks moveHistory changes
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [moveCount]);

  return (
    <div className="flex flex-col h-full min-h-0" data-ocid="move-history">
      <div className="px-4 py-3 border-b border-border flex-shrink-0">
        <h2 className="text-xs font-display font-semibold text-muted-foreground tracking-widest uppercase">
          Moves
        </h2>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2 py-2 scroll-smooth"
      >
        {moveHistory.length === 0 ? (
          <p className="text-xs text-muted-foreground px-2 pt-2 font-body italic">
            Game in progress…
          </p>
        ) : (
          <table className="w-full text-sm" aria-label="Move history">
            <tbody>
              {moveHistory.map((entry, idx) => {
                const isCurrentWhite =
                  activeMoveIdx === idx && !!entry.white && !entry.black;
                const isCurrentBlack = activeMoveIdx === idx && !!entry.black;
                const isLastPair = idx === lastIndex;

                return (
                  <tr
                    key={entry.moveNumber}
                    className={`rounded transition-colors duration-100 ${isLastPair ? "bg-muted/30" : "hover:bg-muted/20"}`}
                    aria-current={isLastPair ? "true" : undefined}
                    data-ocid={`move-row-${entry.moveNumber}`}
                  >
                    <td className="py-1 px-2 text-muted-foreground font-mono text-xs w-8 select-none">
                      {entry.moveNumber}.
                    </td>
                    <td
                      className={`py-1 px-2 font-mono text-xs rounded-sm transition-colors ${isCurrentWhite ? "text-secondary font-semibold" : "text-foreground"}`}
                    >
                      {entry.white?.notation ?? ""}
                    </td>
                    <td
                      className={`py-1 px-2 font-mono text-xs rounded-sm transition-colors ${isCurrentBlack ? "text-secondary font-semibold" : "text-muted-foreground"}`}
                    >
                      {entry.black?.notation ?? ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
