import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Crown, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import { Layout, StatusBadge } from "./Layout";
import { AnalogClock } from "./components/AnalogClock";
import { ChessBoard } from "./components/ChessBoard";
import {
  ClockStyleSelector,
  useClockStyle,
} from "./components/ClockStyleSelector";
import type { ClockStyle } from "./components/ClockStyleSelector";
import {
  DurationSelector,
  useGameDuration,
} from "./components/DurationSelector";
import type { GameDuration } from "./components/DurationSelector";
import { EngineThinking } from "./components/EngineThinking";
import { GameControls } from "./components/GameControls";
import { MoveHistory } from "./components/MoveHistory";
import {
  OpponentSelector,
  useOpponentMode,
} from "./components/OpponentSelector";
import { PlayerNameInput } from "./components/PlayerNameInput";
import { RulesPane } from "./components/RulesPane";
import { ThemeSelector, useChessTheme } from "./components/ThemeSelector";
import {
  applyMove,
  createInitialGameState,
  getLegalMoves,
  getPieceSymbol,
} from "./lib/chess";
import { getBestMove } from "./lib/chessEngine";
import type { GameState, PieceColor, PieceType, Position } from "./types/chess";

// ─── Player Names ─────────────────────────────────────────────────────────────

const NAMES_STORAGE_KEY = "chess-player-names";

function usePlayerNames() {
  const [whitePlayerName, setWhitePlayerName] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(NAMES_STORAGE_KEY);
      if (stored)
        return (
          (JSON.parse(stored) as { white: string; black: string }).white ||
          "Player White"
        );
    } catch {}
    return "Player White";
  });
  const [blackPlayerName, setBlackPlayerName] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(NAMES_STORAGE_KEY);
      if (stored)
        return (
          (JSON.parse(stored) as { white: string; black: string }).black ||
          "Player Black"
        );
    } catch {}
    return "Player Black";
  });

  useEffect(() => {
    localStorage.setItem(
      NAMES_STORAGE_KEY,
      JSON.stringify({ white: whitePlayerName, black: blackPlayerName }),
    );
  }, [whitePlayerName, blackPlayerName]);

  return {
    whitePlayerName,
    blackPlayerName,
    setWhitePlayerName,
    setBlackPlayerName,
  };
}

// ─── Win Counters ─────────────────────────────────────────────────────────────

const WIN_COUNTERS_KEY = "chess-win-counters";

interface WinCounters {
  white: number;
  black: number;
}

function useWinCounters() {
  const [counters, setCounters] = useState<WinCounters>(() => {
    try {
      const stored = localStorage.getItem(WIN_COUNTERS_KEY);
      if (stored) return JSON.parse(stored) as WinCounters;
    } catch {}
    return { white: 0, black: 0 };
  });

  useEffect(() => {
    localStorage.setItem(WIN_COUNTERS_KEY, JSON.stringify(counters));
  }, [counters]);

  const incrementWinner = useCallback((winner: PieceColor) => {
    setCounters((prev) => ({
      ...prev,
      white: winner === "White" ? prev.white + 1 : prev.white,
      black: winner === "Black" ? prev.black + 1 : prev.black,
    }));
  }, []);

  const resetCounters = useCallback(() => {
    setCounters({ white: 0, black: 0 });
  }, []);

  return { counters, incrementWinner, resetCounters };
}

// ─── Background Color ─────────────────────────────────────────────────────────

const BG_COLOR_KEY = "chess-bg-color";
const DEFAULT_BG_COLOR = "#D3D3D3";

function useBackgroundColor() {
  const [bgColor, setBgColor] = useState<string>(() => {
    return localStorage.getItem(BG_COLOR_KEY) ?? DEFAULT_BG_COLOR;
  });

  useEffect(() => {
    localStorage.setItem(BG_COLOR_KEY, bgColor);
  }, [bgColor]);

  return { bgColor, setBgColor };
}

// ─── Board Flip ───────────────────────────────────────────────────────────────

const FLIP_BOARD_KEY = "chess-board-flipped";

function useFlipBoard() {
  const [isFlipped, setIsFlipped] = useState<boolean>(() => {
    return localStorage.getItem(FLIP_BOARD_KEY) === "true";
  });

  const toggleFlip = useCallback(() => {
    setIsFlipped((prev) => {
      const next = !prev;
      localStorage.setItem(FLIP_BOARD_KEY, String(next));
      return next;
    });
  }, []);

  return { isFlipped, toggleFlip };
}

// ─── End-of-Game Feedback (flash + sound) ─────────────────────────────────────

function playGameEndSound(isWin: boolean) {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    if (isWin) {
      // Triumphant ascending fanfare
      const notes = [
        { freq: 523.25, start: 0, duration: 0.15 },
        { freq: 659.25, start: 0.15, duration: 0.15 },
        { freq: 783.99, start: 0.3, duration: 0.15 },
        { freq: 1046.5, start: 0.45, duration: 0.5 },
      ];
      for (const note of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.value = note.freq;
        gain.gain.setValueAtTime(0.35, now + note.start);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          now + note.start + note.duration,
        );
        osc.start(now + note.start);
        osc.stop(now + note.start + note.duration + 0.05);
      }
    } else {
      // Neutral draw/timeout thud
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.4);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.65);
    }

    // Auto-close the context
    setTimeout(() => ctx.close(), 2000);
  } catch {
    // Web Audio may be blocked — silently ignore
  }
}

interface FlashOverlayProps {
  isWin: boolean;
  onDone: () => void;
}

function FlashOverlay({ isWin, onDone }: FlashOverlayProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 800);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 flash-overlay"
      style={{
        background: isWin
          ? "radial-gradient(ellipse at center, oklch(0.88 0.22 55 / 0.7) 0%, oklch(0.88 0.22 55 / 0) 70%)"
          : "radial-gradient(ellipse at center, oklch(0.7 0.1 265 / 0.5) 0%, oklch(0.7 0.1 265 / 0) 70%)",
        animation: "flash-fade 0.8s ease-out forwards",
      }}
      aria-hidden="true"
    />
  );
}

// ─── Clock ────────────────────────────────────────────────────────────────────

function durationToSeconds(duration: GameDuration): number {
  if (duration === null) return 0;
  return duration * 60;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function useClock(
  gameState: GameState,
  initialTime: number,
  isPaused: boolean,
) {
  const [whiteTime, setWhiteTime] = useState(initialTime);
  const [blackTime, setBlackTime] = useState(initialTime);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isGameOver =
    gameState.status !== "playing" && gameState.status !== "check";
  const currentTurn = gameState.currentTurn;
  const isTimed = initialTime > 0;

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isGameOver || !isTimed || isPaused) return;
    intervalRef.current = setInterval(() => {
      if (currentTurn === "White") {
        setWhiteTime((t) => Math.max(0, t - 1));
      } else {
        setBlackTime((t) => Math.max(0, t - 1));
      }
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentTurn, isGameOver, isTimed, isPaused]);

  const resetClocks = useCallback((newInitialTime: number) => {
    setWhiteTime(newInitialTime);
    setBlackTime(newInitialTime);
  }, []);

  return { whiteTime, blackTime, resetClocks };
}

// ─── Promotion Dialog ─────────────────────────────────────────────────────────

const PROMO_PIECES: PieceType[] = ["Queen", "Rook", "Bishop", "Knight"];

interface PromotionDialogProps {
  color: PieceColor;
  onSelect: (piece: PieceType) => void;
}

function PromotionDialog({ color, onSelect }: PromotionDialogProps) {
  return (
    <Dialog open>
      <DialogContent className="bg-card border-border max-w-xs">
        <DialogHeader>
          <DialogTitle className="font-display text-center">
            Choose Promotion
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-2 pt-2">
          {PROMO_PIECES.map((pt) => (
            <button
              type="button"
              key={pt}
              className="flex flex-col items-center gap-1 p-3 rounded-md bg-muted hover:bg-accent/20 transition-colors border border-transparent hover:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onSelect(pt)}
              data-ocid={`promo-${pt.toLowerCase()}`}
            >
              <span
                className={`text-4xl ${color === "White" ? "piece-white" : "piece-black"}`}
              >
                {getPieceSymbol({ type: pt, color })}
              </span>
              <span className="text-xs text-muted-foreground font-display">
                {pt}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Win Counters Display ─────────────────────────────────────────────────────

interface WinCountersDisplayProps {
  counters: WinCounters;
  whitePlayerName: string;
  blackPlayerName: string;
  onReset: () => void;
}

function WinCountersDisplay({
  counters,
  whitePlayerName,
  blackPlayerName,
  onReset,
}: WinCountersDisplayProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap" data-ocid="win-counters">
      <div className="flex items-center gap-2">
        <span className="text-xs font-display font-semibold text-muted-foreground tracking-widest uppercase hidden sm:block">
          Wins
        </span>
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center gap-1 px-2 py-1 rounded bg-muted/60 border border-border/40"
            data-ocid="win-count-white"
          >
            <span className="text-xs font-display text-foreground truncate max-w-[72px]">
              {whitePlayerName.split(" ")[0]}
            </span>
            <span className="text-sm font-display font-bold text-foreground tabular-nums min-w-[16px] text-center">
              {counters.white}
            </span>
          </div>
          <span className="text-xs text-muted-foreground/40">–</span>
          <div
            className="flex items-center gap-1 px-2 py-1 rounded bg-muted/60 border border-border/40"
            data-ocid="win-count-black"
          >
            <span className="text-sm font-display font-bold text-foreground tabular-nums min-w-[16px] text-center">
              {counters.black}
            </span>
            <span className="text-xs font-display text-foreground truncate max-w-[72px]">
              {blackPlayerName.split(" ")[0]}
            </span>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="text-xs font-display text-muted-foreground hover:text-foreground h-7 px-2"
        data-ocid="btn-reset-scores"
        title="Reset win counters"
      >
        Reset Scores
      </Button>
    </div>
  );
}

// ─── Background Color Picker ──────────────────────────────────────────────────

interface BgColorPickerProps {
  bgColor: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

function BgColorPicker({
  bgColor,
  onChange,
  disabled = false,
}: BgColorPickerProps) {
  return (
    <div
      className={`flex items-center gap-2 ${disabled ? "opacity-50" : ""}`}
      data-ocid="bg-color-picker"
    >
      <span className="text-xs font-display font-semibold text-muted-foreground tracking-widest uppercase hidden sm:block">
        Background
      </span>
      <label
        className={`relative flex items-center ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        {/* Swatch preview */}
        <span
          className="w-7 h-7 rounded-md border border-border/60 flex-shrink-0 overflow-hidden block"
          style={{ backgroundColor: bgColor }}
          aria-hidden="true"
        />
        <input
          type="color"
          value={bgColor}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`absolute inset-0 opacity-0 w-full h-full ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
          aria-label="Background color"
          data-ocid="input-bg-color"
        />
      </label>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  gameState: GameState;
  whiteTime: number;
  blackTime: number;
  isTimed: boolean;
  whitePlayerName: string;
  blackPlayerName: string;
  engineThinking: boolean;
  opponentMode: string;
  difficulty: number;
  onOpponentChange: (mode: "human" | "engine", d: number) => void;
  settingsLocked: boolean;
  clockStyle: ClockStyle;
  onClockStyleChange: (style: ClockStyle) => void;
  isFlipped: boolean;
}

// When flipped, Black is at the bottom — show Black clock first (top) → no, show in
// board-matching order: top player first, bottom player second.
// Default (not flipped): White at bottom → show Black on top, White on bottom.
// Flipped: Black at bottom → show White on top, Black on bottom.

function Sidebar({
  gameState,
  whiteTime,
  blackTime,
  isTimed,
  whitePlayerName,
  blackPlayerName,
  engineThinking,
  opponentMode,
  difficulty,
  onOpponentChange,
  settingsLocked,
  clockStyle,
  onClockStyleChange,
  isFlipped,
}: SidebarProps) {
  const { capturedByWhite, capturedByBlack, currentTurn, status } = gameState;
  const isPlaying = status === "playing" || status === "check";

  const playerName = (color: PieceColor) =>
    color === "White" ? whitePlayerName : blackPlayerName;

  // Top-to-bottom order: opponent (far side) first, current player second
  const clockColors: PieceColor[] = isFlipped
    ? ["White", "Black"]
    : ["Black", "White"];

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto">
      {isTimed && (
        <div className="grid grid-cols-1 gap-3">
          {clockColors.map((color) => {
            const isActive = isPlaying && currentTurn === color;
            const time = color === "White" ? whiteTime : blackTime;
            const isLow = time < 60;
            return (
              <div
                key={color}
                className={`rounded-md px-4 py-3 border transition-all duration-300 ${isActive ? "bg-muted border-primary/40 clock-active" : "bg-muted/40 border-border"}`}
                data-ocid={`clock-${color.toLowerCase()}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-display uppercase tracking-wider truncate max-w-[80%]">
                    {playerName(color)}
                  </span>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-primary turn-indicator flex-shrink-0" />
                  )}
                </div>
                {clockStyle === "analogue" ? (
                  <div className="flex justify-center mt-1">
                    <AnalogClock
                      seconds={time}
                      size={80}
                      isLow={isLow}
                      isActive={isActive}
                    />
                  </div>
                ) : (
                  <span
                    className={`font-display font-bold text-2xl tabular-nums tracking-tight ${isLow && isActive ? "text-destructive" : "text-foreground"}`}
                  >
                    {formatTime(time)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!isTimed && (
        <div className="grid grid-cols-1 gap-3">
          {clockColors.map((color) => {
            const isActive = isPlaying && currentTurn === color;
            return (
              <div
                key={color}
                className={`rounded-md px-4 py-2.5 border transition-all duration-300 ${isActive ? "bg-muted border-primary/40" : "bg-muted/40 border-border"}`}
                data-ocid={`player-${color.toLowerCase()}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-display font-semibold text-foreground truncate max-w-[85%]">
                    {playerName(color)}
                  </span>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-primary turn-indicator flex-shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Engine thinking indicator */}
      <EngineThinking visible={engineThinking} />

      <Separator />

      {/* Opponent selector */}
      <div>
        <h3 className="text-xs font-display font-semibold text-muted-foreground tracking-widest uppercase mb-2">
          Play Against
        </h3>
        <OpponentSelector
          opponentMode={opponentMode as "human" | "engine"}
          difficulty={difficulty}
          onChange={onOpponentChange}
          disabled={settingsLocked}
        />
      </div>

      <Separator />

      {/* Clock style selector — only shown when game is timed */}
      {isTimed && (
        <div>
          <h3 className="text-xs font-display font-semibold text-muted-foreground tracking-widest uppercase mb-2">
            Clock Style
          </h3>
          <ClockStyleSelector
            clockStyle={clockStyle}
            onSelect={onClockStyleChange}
            disabled={settingsLocked}
          />
        </div>
      )}

      {isTimed && <Separator />}

      <div>
        <h3 className="text-xs font-display font-semibold text-muted-foreground tracking-widest uppercase mb-2">
          Captured
        </h3>
        <div className="space-y-1.5">
          {[
            { label: "white", pieces: capturedByWhite },
            { label: "black", pieces: capturedByBlack },
          ].map(({ label, pieces }) => (
            <div key={label} className="min-h-[28px]">
              {pieces.length > 0 && (
                <div
                  className="flex flex-wrap gap-0.5"
                  data-ocid="captured-pieces"
                >
                  {pieces.map((p, i) => (
                    <span
                      key={`${label}-${p.type}-${i}`}
                      className={`text-xl ${p.color === "White" ? "piece-white" : "piece-black"}`}
                      style={{ textShadow: "none" }}
                    >
                      {getPieceSymbol(p)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-xs font-display font-semibold text-muted-foreground tracking-widest uppercase mb-2">
          50-Move Rule
        </h3>
        <p className="text-sm text-foreground font-mono">
          {gameState.halfMoveClock} / 100
        </p>
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

interface HeaderProps {
  gameState: GameState;
  themeId: string;
  onThemeSelect: (id: string) => void;
  duration: GameDuration;
  onDurationSelect: (d: GameDuration) => void;
  settingsLocked: boolean;
  whitePlayerName: string;
  blackPlayerName: string;
  onWhiteNameChange: (name: string) => void;
  onBlackNameChange: (name: string) => void;
  counters: WinCounters;
  onResetCounters: () => void;
  bgColor: string;
  onBgColorChange: (color: string) => void;
  isPaused: boolean;
}

function Header({
  gameState,
  themeId,
  onThemeSelect,
  duration,
  onDurationSelect,
  settingsLocked,
  whitePlayerName,
  blackPlayerName,
  onWhiteNameChange,
  onBlackNameChange,
  counters,
  onResetCounters,
  bgColor,
  onBgColorChange,
  isPaused,
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 gap-2 flex-wrap">
      <div className="flex items-center gap-2 flex-shrink-0">
        <Crown className="w-5 h-5 text-secondary" />
        <span className="font-display font-bold text-base tracking-tight text-foreground hidden md:block">
          Grandmaster Chess
        </span>
      </div>

      {/* Player name inputs */}
      <div className="flex items-center gap-3 min-w-0">
        <PlayerNameInput
          color="white"
          value={whitePlayerName}
          onChange={onWhiteNameChange}
          disabled={settingsLocked}
        />
        <span className="text-muted-foreground/50 text-xs font-display pb-0.5">
          vs
        </span>
        <PlayerNameInput
          color="black"
          value={blackPlayerName}
          onChange={onBlackNameChange}
          disabled={settingsLocked}
        />
      </div>

      {/* Win counters */}
      <WinCountersDisplay
        counters={counters}
        whitePlayerName={whitePlayerName}
        blackPlayerName={blackPlayerName}
        onReset={onResetCounters}
      />

      <div className="flex items-center gap-3 flex-wrap">
        <DurationSelector
          duration={duration}
          onSelect={onDurationSelect}
          disabled={settingsLocked}
        />
        <ThemeSelector
          activeThemeId={themeId}
          onSelect={onThemeSelect}
          disabled={settingsLocked}
        />
        <BgColorPicker
          bgColor={bgColor}
          onChange={onBgColorChange}
          disabled={settingsLocked}
        />
      </div>

      <StatusBadge
        status={gameState.status}
        currentTurn={gameState.currentTurn}
        winner={gameState.winner}
        isPaused={isPaused}
      />
    </div>
  );
}

// ─── Game Over Dialog ─────────────────────────────────────────────────────────

function GameOverDialog({
  gameState,
  onNewGame,
  whitePlayerName,
  blackPlayerName,
}: {
  gameState: GameState;
  onNewGame: () => void;
  whitePlayerName: string;
  blackPlayerName: string;
}) {
  const isGameOver =
    gameState.status !== "playing" && gameState.status !== "check";
  if (!isGameOver) return null;

  const winnerName =
    gameState.winner === "White" ? whitePlayerName : blackPlayerName;

  const messages: Partial<Record<GameState["status"], string>> = {
    checkmate: `Checkmate! ${winnerName} wins!`,
    stalemate: "Stalemate — It's a draw!",
    "draw-threefold": "Draw by threefold repetition",
    "draw-fifty": "Draw by 50-move rule",
    "draw-insufficient": "Draw — insufficient material",
    resigned: `${winnerName} wins by resignation`,
    timeout: `${winnerName} wins on time!`,
  };

  return (
    <Dialog open>
      <DialogContent className="bg-card border-border max-w-sm text-center">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <Crown className="w-12 h-12 text-secondary" />
          </div>
          <DialogTitle className="font-display text-xl">
            {messages[gameState.status] ?? "Game Over"}
          </DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm mb-4 font-body">
          {gameState.moves.length} moves played
        </p>
        <Button
          onClick={onNewGame}
          className="w-full font-display bg-secondary text-secondary-foreground hover:bg-secondary/80"
          data-ocid="btn-new-game-dialog"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Play Again
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState);
  const [lastMove, setLastMove] = useState<
    { from: Position; to: Position } | undefined
  >();
  const [prePromotionState, setPrePromotionState] = useState<GameState | null>(
    null,
  );
  const [pendingPromoMove, setPendingPromoMove] = useState<{
    from: Position;
    to: Position;
  } | null>(null);
  const [drawOffer, setDrawOffer] = useState<PieceColor | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [flashIsWin, setFlashIsWin] = useState(false);
  const [engineThinking, setEngineThinking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const historyStackRef = useRef<GameState[]>([]);
  const hasFiredRef = useRef(false);
  const engineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { duration, setDuration } = useGameDuration();
  const { activeThemeId, setActiveThemeId } = useChessTheme();
  const {
    whitePlayerName,
    blackPlayerName,
    setWhitePlayerName,
    setBlackPlayerName,
  } = usePlayerNames();
  const { counters, incrementWinner, resetCounters } = useWinCounters();
  const { bgColor, setBgColor } = useBackgroundColor();
  const { opponentMode, setOpponentMode, difficulty, setDifficulty } =
    useOpponentMode();
  const { clockStyle, setClockStyle } = useClockStyle();
  const { isFlipped, toggleFlip } = useFlipBoard();

  const initialTime = durationToSeconds(duration);
  const isTimed = duration !== null;

  // Track if game has started (first move made) — all settings locked while playing
  const gameHasStarted = gameState.moves.length > 0;
  const isGameOver =
    gameState.status !== "playing" && gameState.status !== "check";
  const settingsLocked = gameHasStarted && !isGameOver;

  const { whiteTime, blackTime, resetClocks } = useClock(
    gameState,
    initialTime,
    isPaused,
  );

  // ── Timeout detection ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isTimed) return;
    if (isGameOver) return;
    const timedOut =
      (gameState.currentTurn === "White" && whiteTime === 0) ||
      (gameState.currentTurn === "Black" && blackTime === 0);
    if (!timedOut) return;
    const winner: PieceColor =
      gameState.currentTurn === "White" ? "Black" : "White";
    setGameState((prev) => ({
      ...prev,
      status: "timeout",
      winner,
    }));
  }, [whiteTime, blackTime, gameState.currentTurn, isTimed, isGameOver]);

  // ── End-of-game feedback (flash + sound + win counter) ─────────────────────
  useEffect(() => {
    if (!isGameOver) {
      hasFiredRef.current = false;
      return;
    }
    if (hasFiredRef.current) return;
    hasFiredRef.current = true;

    const hasWinner =
      gameState.status === "checkmate" ||
      gameState.status === "resigned" ||
      gameState.status === "timeout";

    setFlashIsWin(hasWinner);
    setShowFlash(true);
    playGameEndSound(hasWinner);

    if (hasWinner && gameState.winner) {
      incrementWinner(gameState.winner);
    }
  }, [isGameOver, gameState.status, gameState.winner, incrementWinner]);

  // ── Engine move trigger ────────────────────────────────────────────────────
  // After a state update, if it's the engine's turn (Black), fire getBestMove
  useEffect(() => {
    if (opponentMode !== "engine") return;
    if (isGameOver) return;
    if (gameState.currentTurn !== "Black") return;
    if (engineThinking) return;
    if (isPaused) return;

    setEngineThinking(true);
    const snapshot = gameState;

    engineTimerRef.current = setTimeout(() => {
      const move = getBestMove(snapshot, difficulty);
      if (move) {
        historyStackRef.current = [...historyStackRef.current, snapshot];
        const next = applyMove(snapshot, move.from, move.to, move.promotion);
        setGameState(next);
        setLastMove({ from: move.from, to: move.to });
      }
      setEngineThinking(false);
    }, 0);

    return () => {
      if (engineTimerRef.current) clearTimeout(engineTimerRef.current);
    };
  }, [
    gameState,
    opponentMode,
    difficulty,
    isGameOver,
    engineThinking,
    isPaused,
  ]);

  const handleOpponentChange = useCallback(
    (mode: "human" | "engine", d: number) => {
      setOpponentMode(mode);
      setDifficulty(d);
    },
    [setOpponentMode, setDifficulty],
  );

  const handleSquareClick = useCallback((pos: Position) => {
    setDrawOffer(null);
    setGameState((prev) => {
      if (prev.promotionPending) return prev;

      const { board, selectedSquare, currentTurn, enPassantTarget } = prev;
      const piece = board[pos.row][pos.col];

      if (!selectedSquare) {
        if (piece && piece.color === currentTurn) {
          const legal = getLegalMoves(board, pos, enPassantTarget);
          return { ...prev, selectedSquare: pos, legalMovesForSelected: legal };
        }
        return prev;
      }

      if (selectedSquare.row === pos.row && selectedSquare.col === pos.col) {
        return { ...prev, selectedSquare: null, legalMovesForSelected: [] };
      }

      if (piece && piece.color === currentTurn) {
        const legal = getLegalMoves(board, pos, enPassantTarget);
        return { ...prev, selectedSquare: pos, legalMovesForSelected: legal };
      }

      const isLegal = prev.legalMovesForSelected.some(
        (m) => m.row === pos.row && m.col === pos.col,
      );
      if (!isLegal) {
        return { ...prev, selectedSquare: null, legalMovesForSelected: [] };
      }

      const movingPiece = board[selectedSquare.row][selectedSquare.col];
      if (movingPiece?.type === "Pawn" && (pos.row === 0 || pos.row === 7)) {
        setPrePromotionState(prev);
        setPendingPromoMove({ from: selectedSquare, to: pos });
        setLastMove({ from: selectedSquare, to: pos });
        historyStackRef.current = [...historyStackRef.current, prev];
        return {
          ...prev,
          promotionPending: pos,
          selectedSquare: null,
          legalMovesForSelected: [],
        };
      }

      historyStackRef.current = [...historyStackRef.current, prev];
      const next = applyMove(prev, selectedSquare, pos);
      setLastMove({ from: selectedSquare, to: pos });
      return next;
    });
  }, []);

  const handlePromotion = useCallback(
    (piece: PieceType) => {
      if (!prePromotionState || !pendingPromoMove) return;
      const next = applyMove(
        prePromotionState,
        pendingPromoMove.from,
        pendingPromoMove.to,
        piece,
      );
      setGameState(next);
      setPrePromotionState(null);
      setPendingPromoMove(null);
    },
    [prePromotionState, pendingPromoMove],
  );

  const handleNewGame = useCallback(() => {
    // Clear any pending engine timer
    if (engineTimerRef.current) {
      clearTimeout(engineTimerRef.current);
      engineTimerRef.current = null;
    }
    setEngineThinking(false);
    setIsPaused(false);
    setGameState(createInitialGameState());
    setLastMove(undefined);
    setPrePromotionState(null);
    setPendingPromoMove(null);
    setDrawOffer(null);
    setShowFlash(false);
    hasFiredRef.current = false;
    historyStackRef.current = [];
    resetClocks(durationToSeconds(duration));
  }, [resetClocks, duration]);

  const handleResign = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      status: "resigned",
      winner: prev.currentTurn === "White" ? "Black" : "White",
    }));
    setDrawOffer(null);
  }, []);

  const handleOfferDraw = useCallback(() => {
    setGameState((prev) => {
      const over = prev.status !== "playing" && prev.status !== "check";
      if (over) return prev;
      return prev;
    });
    setDrawOffer((prev) => (prev ? null : gameState.currentTurn));
  }, [gameState.currentTurn]);

  const handleClaimDraw = useCallback(() => {
    setGameState((prev) => {
      const canClaim =
        prev.halfMoveClock >= 100 ||
        prev.positionHistory.filter(
          (p) => p === prev.positionHistory[prev.positionHistory.length - 1],
        ).length >= 3;
      if (!canClaim) return prev;
      return {
        ...prev,
        status: "draw-fifty",
        winner: undefined,
      };
    });
    setDrawOffer(null);
  }, []);

  const handleAcceptDraw = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      status: "stalemate",
      winner: undefined,
    }));
    setDrawOffer(null);
  }, []);

  const handleDeclineDraw = useCallback(() => {
    setDrawOffer(null);
  }, []);

  const handleUndo = useCallback(() => {
    const stack = historyStackRef.current;
    if (stack.length < 1) return;
    // In engine mode: undo takes back the engine move (if last), then can undo again for human's move
    const prevState = stack[stack.length - 1];
    historyStackRef.current = stack.slice(0, -1);
    setGameState(prevState);
    setLastMove(undefined);
    setDrawOffer(null);
    setEngineThinking(false);
    if (engineTimerRef.current) {
      clearTimeout(engineTimerRef.current);
      engineTimerRef.current = null;
    }
  }, []);

  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const promotionColor: PieceColor = gameState.promotionPending
    ? gameState.currentTurn
    : "White";

  const drawOfferForCurrentPlayer =
    drawOffer !== null && drawOffer !== gameState.currentTurn;

  return (
    <div style={{ backgroundColor: bgColor }} className="min-h-screen">
      <Layout
        gameState={gameState}
        header={
          <Header
            gameState={gameState}
            themeId={activeThemeId}
            onThemeSelect={setActiveThemeId}
            duration={duration}
            onDurationSelect={setDuration}
            settingsLocked={settingsLocked}
            whitePlayerName={whitePlayerName}
            blackPlayerName={blackPlayerName}
            onWhiteNameChange={setWhitePlayerName}
            onBlackNameChange={setBlackPlayerName}
            counters={counters}
            onResetCounters={resetCounters}
            bgColor={bgColor}
            onBgColorChange={setBgColor}
            isPaused={isPaused}
          />
        }
        board={(() => {
          const {
            board,
            selectedSquare,
            legalMovesForSelected,
            currentTurn,
            status,
          } = gameState;
          const isDisabled =
            (status !== "playing" && status !== "check") ||
            engineThinking ||
            isPaused;
          // Find the king position if in check/checkmate
          let checkKingPos: Position | null = null;
          if (status === "check" || status === "checkmate") {
            outer: for (let r = 0; r < 8; r++) {
              for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (p?.type === "King" && p.color === currentTurn) {
                  checkKingPos = { row: r, col: c };
                  break outer;
                }
              }
            }
          }
          const lastMoveForBoard = lastMove ?? null;
          return (
            <ChessBoard
              board={board}
              selectedSquare={selectedSquare}
              validMoveTargets={legalMovesForSelected}
              lastMove={lastMoveForBoard as import("./types/chess").Move | null}
              isInCheck={status === "check" || status === "checkmate"}
              checkKingPosition={checkKingPos}
              onSquareClick={handleSquareClick}
              isFlipped={isFlipped}
              isDisabled={isDisabled}
              engineThinking={engineThinking}
            />
          );
        })()}
        sidebar={
          <Sidebar
            gameState={gameState}
            whiteTime={whiteTime}
            blackTime={blackTime}
            isTimed={isTimed}
            whitePlayerName={whitePlayerName}
            blackPlayerName={blackPlayerName}
            engineThinking={engineThinking}
            opponentMode={opponentMode}
            difficulty={difficulty}
            onOpponentChange={handleOpponentChange}
            settingsLocked={settingsLocked}
            clockStyle={clockStyle}
            onClockStyleChange={setClockStyle}
            isFlipped={isFlipped}
          />
        }
        rulesPane={<RulesPane />}
        moveList={<MoveHistory gameState={gameState} />}
        controls={
          drawOfferForCurrentPlayer ? (
            <div
              className="flex items-center justify-between px-4 py-3 gap-3"
              data-ocid="draw-offer-controls"
            >
              <span className="text-sm font-body text-muted-foreground">
                <span className="text-foreground font-semibold">
                  {drawOffer === "White" ? whitePlayerName : blackPlayerName}
                </span>{" "}
                offers a draw
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDeclineDraw}
                  className="font-display text-xs"
                  data-ocid="btn-decline-draw"
                >
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={handleAcceptDraw}
                  className="font-display text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  data-ocid="btn-accept-draw"
                >
                  Accept Draw
                </Button>
              </div>
            </div>
          ) : (
            <GameControls
              gameState={gameState}
              onNewGame={handleNewGame}
              onResign={handleResign}
              onOfferDraw={handleOfferDraw}
              onClaimDraw={handleClaimDraw}
              onUndo={handleUndo}
              drawOffer={drawOffer}
              isPaused={isPaused}
              onTogglePause={handleTogglePause}
              isFlipped={isFlipped}
              onFlipBoard={toggleFlip}
            />
          )
        }
      />

      {gameState.promotionPending && (
        <PromotionDialog color={promotionColor} onSelect={handlePromotion} />
      )}

      <GameOverDialog
        gameState={gameState}
        onNewGame={handleNewGame}
        whitePlayerName={whitePlayerName}
        blackPlayerName={blackPlayerName}
      />

      {showFlash && (
        <FlashOverlay isWin={flashIsWin} onDone={() => setShowFlash(false)} />
      )}
    </div>
  );
}
