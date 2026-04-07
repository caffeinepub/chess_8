# Design Brief: Chess Game

## Tone & Differentiation
Refined minimalism with premium aesthetic. High-end chess club meets digital sophistication. Clean geometry, sharp focus on gameplay, breathing room in UI. No decoration — intentional restraint elevates the experience.

## Color Palette

| Token | Light OKLCH | Dark OKLCH | Purpose |
|-------|-------------|-----------|---------|
| Primary | `0.45 0.15 120` | `0.72 0.18 120` | Game interactivity, move highlights, turn indicators |
| Secondary | `0.88 0.12 45` | `0.65 0.15 55` | Board squares (warm cream/gold tones) |
| Accent | `0.62 0.25 55` | `0.72 0.2 55` | Active states, selected pieces, high-contrast accents |
| Foreground | `0.18 0.02 265` | `0.96 0.01 56` | Game text, labels, piece notation |
| Background | `0.97 0.01 56` | `0.12 0.01 265` | Page background (light: off-white; dark: deep charcoal) |
| Card | `1.0 0 0` | `0.16 0.01 265` | UI panels (header, sidebar, status) |
| Border | `0.88 0.01 260` | `0.24 0.01 265` | Subtle dividers, zone separation |
| Muted | `0.92 0.01 260` | `0.2 0.01 265` | Secondary backgrounds, reduced hierarchy |

## Typography
- **Display**: Space Grotesk (headers, game status, turn indicators) — geometric, modern, premium
- **Body**: DM Sans (move history, player labels, controls) — clean, neutral, no-nonsense
- **Mono**: System monospace (notation: algebraic chess moves) — consistent with input context

## Structural Zones

| Zone | Background | Border | Purpose |
|------|-----------|--------|---------|
| Header | `card` | `border` | Game status, player names, turn indicator, clock |
| Game Board | `background` | none | 8×8 board grid with alternating squares and piece display |
| Move History Sidebar | `muted/40` | `border` | Scrollable list of moves, algebraic notation |
| Control Footer | `muted/30` | `border` | Buttons: New Game, Undo, Resign, Settings |

## Component Patterns
- **Buttons**: Minimal styling, clear hierarchy. Primary action (New Game) uses `primary` with rounded-sm (2px). Secondary actions (Undo, Resign) use `secondary` with border outline.
- **Board Squares**: Alternating `secondary` (light cream) and `secondary/60` (darker tan). Active/selected squares highlighted with `ring-2 ring-accent`.
- **Move History**: Monospace, small text, left-aligned list. Hover state uses `bg-muted` for subtle highlight.
- **Piece Display**: Clean Unicode chess symbols (♔ ♕ ♖ ♗ ♘ ♙ for white; ♚ ♛ ♜ ♝ ♞ ♟ for black). No additional decoration.

## Spacing & Rhythm
- **Board**: 64px or 80px per square (responsive scaling). 8px gutter around board for coordinates.
- **Header/Footer**: 16px vertical padding, 24px horizontal.
- **Sidebar**: 12px between move items, 16px padding edges.
- Vertical rhythm: 4px, 8px, 12px, 16px, 24px, 32px increments.

## Motion
- **Piece Movement**: Smooth transition (0.3s ease-out) as pieces move to new squares.
- **Highlights**: Board ring highlight on piece selection (instant) and move targets (fade in 0.15s).
- **Turn Change**: Subtle pulse or fade on status indicator when turn passes.
- **No animations** on scroll, no entrance effects on page load — restraint over flash.

## Elevation & Depth
- Light mode: Flat design with subtle borders to define zones. Card panels have minimal shadow (xs: `0 1px 2px rgba(0,0,0,0.05)`).
- Dark mode: Slight elevation via border and background differentiation. No glow or neon effects.

## Responsive Behavior
- **Mobile**: Board scales to fit viewport (portrait orientation). Header/controls stack vertically. Move history collapses to drawer or smaller sidebar.
- **Tablet/Desktop**: Horizontal layout maintained. Wide sidebar for full move history. Header and footer remain visible.

## Signature Detail
**Board Coordinates**: Rank numbers (1–8) on left edge, file letters (a–h) on bottom edge, rendered in smaller muted text outside the board perimeter. Creates a professional, reference-able game space reminiscent of real chess boards.

## Constraints
- **No blur, no gradients**: Clean, sharp edges. Depth via layering and borders, not effects.
- **High contrast**: Game elements must be legible at 100% zoom on mobile.
- **No custom shapes**: Board is rectangular grid, buttons are rounded-sm, cards have minimal radius.
- **Dark mode enforced**: Ship dark mode by default for premium feel and eye comfort during gameplay.
