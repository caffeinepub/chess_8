import { useEffect, useState } from "react";

export type GameDuration = 3 | 5 | 10 | null; // null = unlimited

const STORAGE_KEY = "chess-game-duration";
const DEFAULT_DURATION: GameDuration = 10;

const DURATION_OPTIONS: { value: GameDuration; label: string }[] = [
  { value: 3, label: "3 min" },
  { value: 5, label: "5 min" },
  { value: 10, label: "10 min" },
  { value: null, label: "∞" },
];

export function useGameDuration() {
  const [duration, setDuration] = useState<GameDuration>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "null") return null;
    const num = Number(stored);
    if (num === 3 || num === 5 || num === 10) return num;
    return DEFAULT_DURATION;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(duration));
  }, [duration]);

  return { duration, setDuration };
}

interface DurationSelectorProps {
  duration: GameDuration;
  onSelect: (d: GameDuration) => void;
  disabled?: boolean;
}

export function DurationSelector({
  duration,
  onSelect,
  disabled = false,
}: DurationSelectorProps) {
  return (
    <div className="flex items-center gap-2" data-ocid="duration-selector">
      <span className="text-xs font-display font-semibold text-muted-foreground tracking-widest uppercase hidden sm:block">
        Time
      </span>
      <fieldset
        className="flex items-center rounded-md border border-border/50 overflow-hidden m-0 p-0"
        aria-label="Game duration"
      >
        {DURATION_OPTIONS.map((opt) => {
          const isActive = opt.value === duration;
          return (
            <button
              key={String(opt.value)}
              type="button"
              aria-pressed={isActive}
              aria-label={
                opt.label === "∞" ? "Unlimited time" : `${opt.value} minutes`
              }
              disabled={disabled}
              onClick={() => onSelect(opt.value)}
              data-ocid={`duration-${opt.value ?? "unlimited"}`}
              className={`px-2.5 py-1 text-xs font-display font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset border-r border-border/30 last:border-r-0 ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : disabled
                    ? "bg-muted/20 text-muted-foreground/50 cursor-not-allowed"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </fieldset>
    </div>
  );
}
