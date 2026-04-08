import { useEffect, useState } from "react";

export type ClockStyle = "digital" | "analogue";

const STORAGE_KEY = "clockStyle";
const DEFAULT_STYLE: ClockStyle = "digital";

export function useClockStyle() {
  const [clockStyle, setClockStyle] = useState<ClockStyle>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "digital" || stored === "analogue") return stored;
    return DEFAULT_STYLE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, clockStyle);
  }, [clockStyle]);

  return { clockStyle, setClockStyle };
}

interface ClockStyleSelectorProps {
  clockStyle: ClockStyle;
  onSelect: (style: ClockStyle) => void;
  disabled?: boolean;
}

const OPTIONS: { value: ClockStyle; label: string }[] = [
  { value: "digital", label: "Digital" },
  { value: "analogue", label: "Analogue" },
];

export function ClockStyleSelector({
  clockStyle,
  onSelect,
  disabled = false,
}: ClockStyleSelectorProps) {
  return (
    <div className="flex items-center gap-2" data-ocid="clock-style-selector">
      <span className="text-xs font-display font-semibold text-muted-foreground tracking-widest uppercase hidden sm:block">
        Clock
      </span>
      <fieldset
        className="flex items-center rounded-md border border-border/50 overflow-hidden m-0 p-0"
        aria-label="Clock style"
      >
        {OPTIONS.map((opt) => {
          const isActive = opt.value === clockStyle;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={isActive}
              aria-label={`${opt.label} clock`}
              disabled={disabled}
              onClick={() => onSelect(opt.value)}
              data-ocid={`clock-style-${opt.value}`}
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
