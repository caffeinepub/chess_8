interface AnalogClockProps {
  /** Remaining time in seconds */
  seconds: number;
  /** Diameter of the clock in pixels (default: 80) */
  size?: number;
  /** Whether time is critically low (< 60s) — tints second hand red */
  isLow?: boolean;
  /** Whether this clock is the active player's clock */
  isActive?: boolean;
}

/**
 * SVG analogue clock face for chess timers.
 * - Second hand sweeps the full face once per 60s (seconds mod 60)
 * - Minute hand sweeps the full face once per 60 minutes (seconds / 60, mod 60)
 * - 12-hour face style with tick marks
 */
export function AnalogClock({
  seconds,
  size = 80,
  isLow = false,
  isActive = false,
}: AnalogClockProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2; // outer ring radius

  // Map remaining time to hand angles
  // Both hands count DOWN (start at 12, sweep clockwise as time decreases)
  // so we subtract from the max position to get remaining position
  const secsInMinute = seconds % 60; // 0-59
  const minsRemaining = Math.floor(seconds / 60) % 60; // 0-59

  // Angle in degrees: 0° = 12 o'clock, positive = clockwise
  // We want: more time remaining = hand pointing further clockwise (more "full")
  const secAngle = (secsInMinute / 60) * 360 - 90; // offset -90 so 0=12 o'clock
  const minAngle = (minsRemaining / 60) * 360 - 90;

  function handEnd(angleDeg: number, length: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + length * Math.cos(rad),
      y: cy + length * Math.sin(rad),
    };
  }

  const minLen = r * 0.62;
  const secLen = r * 0.78;

  const minTip = handEnd(minAngle, minLen);
  const secTip = handEnd(secAngle, secLen);

  // Tick marks: 12 major ticks
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const tickAngle = (i / 12) * 360 - 90;
    const rad = (tickAngle * Math.PI) / 180;
    const isMajor = i % 3 === 0;
    const outer = r - 1;
    const inner = isMajor ? r - 6 : r - 4;
    return {
      id: `tick-${tickAngle}`,
      x1: cx + outer * Math.cos(rad),
      y1: cy + outer * Math.sin(rad),
      x2: cx + inner * Math.cos(rad),
      y2: cy + inner * Math.sin(rad),
      isMajor,
    };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} remaining`}
      role="img"
    >
      {/* Face */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        className="fill-muted stroke-border"
        strokeWidth={1.5}
      />

      {/* Active glow ring */}
      {isActive && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 1}
          fill="none"
          strokeWidth={1.5}
          className="stroke-primary"
          opacity={0.5}
        />
      )}

      {/* Tick marks */}
      {ticks.map((tick) => (
        <line
          key={tick.id}
          x1={tick.x1}
          y1={tick.y1}
          x2={tick.x2}
          y2={tick.y2}
          className={
            tick.isMajor ? "stroke-foreground" : "stroke-muted-foreground"
          }
          strokeWidth={tick.isMajor ? 1.5 : 1}
          strokeLinecap="round"
          opacity={tick.isMajor ? 0.8 : 0.4}
        />
      ))}

      {/* Minute hand */}
      <line
        x1={cx}
        y1={cy}
        x2={minTip.x}
        y2={minTip.y}
        className="stroke-foreground"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.9}
      />

      {/* Second hand */}
      <line
        x1={cx}
        y1={cy}
        x2={secTip.x}
        y2={secTip.y}
        stroke={isLow ? "oklch(0.62 0.22 22)" : "oklch(0.55 0.22 25)"}
        strokeWidth={1.5}
        strokeLinecap="round"
      />

      {/* Center cap */}
      <circle cx={cx} cy={cy} r={2.5} className="fill-foreground" />
    </svg>
  );
}
