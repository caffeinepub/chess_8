import type React from "react";
import type { GameState, PieceColor } from "./types/chess";

interface LayoutProps {
  gameState: GameState;
  header: React.ReactNode;
  board: React.ReactNode;
  sidebar: React.ReactNode;
  moveList: React.ReactNode;
  controls: React.ReactNode;
}

export function Layout({
  header,
  board,
  sidebar,
  moveList,
  controls,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-subtle flex-shrink-0">
        {header}
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden min-h-0">
        {/* Move list — left sidebar on desktop */}
        <aside className="w-full lg:w-56 xl:w-64 bg-card border-b lg:border-b-0 lg:border-r border-border flex-shrink-0 overflow-hidden flex flex-col order-2 lg:order-1">
          {moveList}
        </aside>

        {/* Board — center */}
        <div className="flex-1 flex items-center justify-center bg-background p-4 lg:p-6 order-1 lg:order-2 min-w-0">
          {board}
        </div>

        {/* Right sidebar — clocks, captures, chat */}
        <aside className="w-full lg:w-64 xl:w-72 bg-card border-t lg:border-t-0 lg:border-l border-border flex-shrink-0 flex flex-col order-3">
          {sidebar}
        </aside>
      </main>

      {/* Bottom controls */}
      <footer className="bg-card border-t border-border shadow-subtle flex-shrink-0">
        {controls}
        <div className="px-4 py-2 border-t border-border/50 flex justify-center">
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors font-body"
          >
            Built with love using caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: GameState["status"];
  currentTurn: PieceColor;
  winner?: PieceColor;
}

export function StatusBadge({ status, currentTurn, winner }: StatusBadgeProps) {
  const getStatusInfo = () => {
    switch (status) {
      case "playing":
        return {
          label: `${currentTurn}'s Turn`,
          color:
            currentTurn === "White"
              ? "bg-foreground text-background"
              : "bg-muted text-foreground",
          dot:
            currentTurn === "White" ? "bg-foreground" : "bg-muted-foreground",
        };
      case "check":
        return {
          label: `${currentTurn} in Check!`,
          color:
            "bg-destructive/20 text-destructive border border-destructive/40",
          dot: "bg-destructive",
        };
      case "checkmate":
        return {
          label: `Checkmate — ${winner} wins!`,
          color: "bg-primary/20 text-primary border border-primary/40",
          dot: "bg-primary",
        };
      case "stalemate":
        return {
          label: "Stalemate — Draw",
          color: "bg-muted text-muted-foreground",
          dot: "bg-muted-foreground",
        };
      case "draw-threefold":
        return {
          label: "Draw — Threefold Repetition",
          color: "bg-muted text-muted-foreground",
          dot: "bg-muted-foreground",
        };
      case "draw-fifty":
        return {
          label: "Draw — 50-Move Rule",
          color: "bg-muted text-muted-foreground",
          dot: "bg-muted-foreground",
        };
      case "draw-insufficient":
        return {
          label: "Draw — Insufficient Material",
          color: "bg-muted text-muted-foreground",
          dot: "bg-muted-foreground",
        };
      case "resigned":
        return {
          label: `${winner} wins by resignation`,
          color: "bg-primary/20 text-primary border border-primary/40",
          dot: "bg-primary",
        };
      default:
        return { label: "", color: "", dot: "" };
    }
  };

  const { label, color, dot } = getStatusInfo();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-display font-semibold tracking-wide ${color}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dot} ${status === "playing" ? "turn-indicator" : ""}`}
      />
      {label}
    </span>
  );
}
