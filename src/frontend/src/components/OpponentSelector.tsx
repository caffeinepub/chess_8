import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OpponentMode = "human" | "engine";

const OPPONENT_MODE_KEY = "chess-opponent-mode";
const ENGINE_DIFFICULTY_KEY = "chess-engine-difficulty";
const DEFAULT_MODE: OpponentMode = "human";
const DEFAULT_DIFFICULTY = 2;

const DIFFICULTY_OPTIONS = [1, 2, 3, 4, 5];
const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Novice",
  2: "Easy",
  3: "Medium",
  4: "Hard",
  5: "Master",
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOpponentMode() {
  const [opponentMode, setOpponentMode] = useState<OpponentMode>(() => {
    const stored = localStorage.getItem(OPPONENT_MODE_KEY);
    return stored === "engine" ? "engine" : DEFAULT_MODE;
  });

  const [difficulty, setDifficulty] = useState<number>(() => {
    const stored = localStorage.getItem(ENGINE_DIFFICULTY_KEY);
    const num = Number(stored);
    return num >= 1 && num <= 5 ? num : DEFAULT_DIFFICULTY;
  });

  useEffect(() => {
    localStorage.setItem(OPPONENT_MODE_KEY, opponentMode);
  }, [opponentMode]);

  useEffect(() => {
    localStorage.setItem(ENGINE_DIFFICULTY_KEY, String(difficulty));
  }, [difficulty]);

  return { opponentMode, setOpponentMode, difficulty, setDifficulty };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface OpponentSelectorProps {
  opponentMode: OpponentMode;
  difficulty: number;
  onChange: (mode: OpponentMode, difficulty: number) => void;
  disabled?: boolean;
}

export function OpponentSelector({
  opponentMode,
  difficulty,
  onChange,
  disabled = false,
}: OpponentSelectorProps) {
  return (
    <div
      className="flex items-center gap-2 flex-wrap"
      data-ocid="opponent-selector"
    >
      <span className="text-xs font-display font-semibold text-muted-foreground tracking-widest uppercase hidden sm:block">
        Opponent
      </span>

      {/* Mode toggle */}
      <fieldset
        className="flex items-center rounded-md border border-border/50 overflow-hidden m-0 p-0"
        aria-label="Opponent mode"
      >
        {(["human", "engine"] as OpponentMode[]).map((mode) => {
          const isActive = opponentMode === mode;
          return (
            <button
              key={mode}
              type="button"
              aria-pressed={isActive}
              aria-label={
                mode === "human" ? "Human opponent" : "Engine opponent"
              }
              disabled={disabled}
              onClick={() => onChange(mode, difficulty)}
              data-ocid={`opponent-${mode}`}
              className={`px-2.5 py-1 text-xs font-display font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset border-r border-border/30 last:border-r-0 ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : disabled
                    ? "bg-muted/20 text-muted-foreground/50 cursor-not-allowed"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              }`}
            >
              {mode === "human" ? "Human" : "Engine"}
            </button>
          );
        })}
      </fieldset>

      {/* Difficulty picker — only visible in engine mode */}
      {opponentMode === "engine" && (
        <fieldset
          className="flex items-center rounded-md border border-border/50 overflow-hidden m-0 p-0"
          aria-label="Engine difficulty"
        >
          {DIFFICULTY_OPTIONS.map((d) => {
            const isActive = difficulty === d;
            return (
              <button
                key={d}
                type="button"
                aria-pressed={isActive}
                aria-label={DIFFICULTY_LABELS[d]}
                disabled={disabled}
                onClick={() => onChange("engine", d)}
                data-ocid={`difficulty-${d}`}
                title={DIFFICULTY_LABELS[d]}
                className={`px-2 py-1 text-xs font-display font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset border-r border-border/30 last:border-r-0 ${
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : disabled
                      ? "bg-muted/20 text-muted-foreground/50 cursor-not-allowed"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                }`}
              >
                {d}
              </button>
            );
          })}
        </fieldset>
      )}

      {opponentMode === "engine" && (
        <span className="text-xs text-muted-foreground font-display hidden lg:block">
          {DIFFICULTY_LABELS[difficulty]}
        </span>
      )}
    </div>
  );
}
