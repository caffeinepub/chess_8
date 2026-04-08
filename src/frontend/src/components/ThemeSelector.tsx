import { useEffect, useState } from "react";

export interface BoardTheme {
  id: string;
  label: string;
  boardLight: string;
  boardDark: string;
  pieceWhite: string;
  pieceWhiteShadow: string;
  pieceBlack: string;
  pieceBlackShadow: string;
}

export const BOARD_THEMES: BoardTheme[] = [
  {
    id: "classic",
    label: "Classic",
    boardLight: "oklch(0.82 0.09 60)",
    boardDark: "oklch(0.32 0.06 200)",
    pieceWhite: "oklch(0.97 0.02 60)",
    pieceWhiteShadow: "0 1px 3px oklch(0.1 0.01 265 / 0.8)",
    pieceBlack: "oklch(0.15 0.02 265)",
    pieceBlackShadow: "0 1px 2px oklch(0.1 0.01 265 / 0.5)",
  },
  {
    id: "emerald",
    label: "Emerald",
    boardLight: "oklch(0.88 0.07 155)",
    boardDark: "oklch(0.30 0.10 155)",
    pieceWhite: "oklch(0.97 0.01 100)",
    pieceWhiteShadow: "0 1px 3px oklch(0.1 0.04 155 / 0.8)",
    pieceBlack: "oklch(0.18 0.04 155)",
    pieceBlackShadow: "0 1px 2px oklch(0.05 0.02 155 / 0.6)",
  },
  {
    id: "sunset",
    label: "Sunset",
    boardLight: "oklch(0.90 0.08 75)",
    boardDark: "oklch(0.30 0.12 20)",
    pieceWhite: "oklch(0.97 0.02 80)",
    pieceWhiteShadow: "0 1px 3px oklch(0.1 0.05 20 / 0.8)",
    pieceBlack: "oklch(0.14 0.04 30)",
    pieceBlackShadow: "0 1px 2px oklch(0.08 0.03 20 / 0.6)",
  },
  {
    id: "ocean",
    label: "Ocean",
    boardLight: "oklch(0.88 0.07 220)",
    boardDark: "oklch(0.25 0.12 255)",
    pieceWhite: "oklch(0.97 0.01 210)",
    pieceWhiteShadow: "0 1px 3px oklch(0.1 0.05 255 / 0.8)",
    pieceBlack: "oklch(0.12 0.05 265)",
    pieceBlackShadow: "0 1px 2px oklch(0.06 0.03 265 / 0.6)",
  },
  {
    id: "contrast",
    label: "High Contrast",
    boardLight: "oklch(0.97 0 0)",
    boardDark: "oklch(0.18 0 0)",
    pieceWhite: "oklch(0.99 0 0)",
    pieceWhiteShadow: "0 1px 4px oklch(0 0 0 / 0.9)",
    pieceBlack: "oklch(0.07 0 0)",
    pieceBlackShadow: "0 1px 2px oklch(0 0 0 / 0.4)",
  },
];

const STORAGE_KEY = "chess-board-theme";

function applyTheme(theme: BoardTheme) {
  const root = document.documentElement;
  root.style.setProperty("--board-light", theme.boardLight);
  root.style.setProperty("--board-dark", theme.boardDark);
  root.style.setProperty("--piece-white-color", theme.pieceWhite);
  root.style.setProperty("--piece-white-shadow", theme.pieceWhiteShadow);
  root.style.setProperty("--piece-black-color", theme.pieceBlack);
  root.style.setProperty("--piece-black-shadow", theme.pieceBlackShadow);
}

export function useChessTheme() {
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? "classic";
  });

  useEffect(() => {
    const theme =
      BOARD_THEMES.find((t) => t.id === activeThemeId) ?? BOARD_THEMES[0];
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme.id);
  }, [activeThemeId]);

  return { activeThemeId, setActiveThemeId };
}

interface ThemeSelectorProps {
  activeThemeId: string;
  onSelect: (id: string) => void;
}

export function ThemeSelector({ activeThemeId, onSelect }: ThemeSelectorProps) {
  return (
    <div className="flex items-center gap-2" data-ocid="theme-selector">
      <span className="text-xs font-display font-semibold text-muted-foreground tracking-widest uppercase hidden sm:block">
        Board
      </span>
      <div className="flex items-center gap-1.5">
        {BOARD_THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            title={theme.label}
            aria-label={`${theme.label} board theme`}
            aria-pressed={activeThemeId === theme.id}
            onClick={() => onSelect(theme.id)}
            data-ocid={`theme-${theme.id}`}
            className={`relative w-7 h-7 rounded-md overflow-hidden flex-shrink-0 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              activeThemeId === theme.id
                ? "ring-2 ring-offset-1 ring-offset-card ring-primary scale-110"
                : "hover:scale-105 ring-1 ring-border/40"
            }`}
          >
            {/* 2×2 mini checkerboard swatch */}
            <div className="grid grid-cols-2 w-full h-full">
              <div style={{ background: theme.boardLight }} />
              <div style={{ background: theme.boardDark }} />
              <div style={{ background: theme.boardDark }} />
              <div style={{ background: theme.boardLight }} />
            </div>
            {/* Piece dots overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex gap-0.5">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: theme.pieceWhite,
                    boxShadow: `0 0 0 0.5px ${theme.pieceBlack}40`,
                  }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: theme.pieceBlack,
                    boxShadow: `0 0 0 0.5px ${theme.pieceWhite}40`,
                  }}
                />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
