interface EngineThinkingProps {
  visible: boolean;
}

export function EngineThinking({ visible }: EngineThinkingProps) {
  if (!visible) return null;

  return (
    <output
      className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/10 border border-secondary/30"
      data-ocid="engine-thinking"
      aria-label="Engine is calculating its move"
    >
      {/* CSS spinner */}
      <span
        className="w-3.5 h-3.5 rounded-full border-2 border-secondary/30 border-t-secondary flex-shrink-0"
        style={{ animation: "spin 0.8s linear infinite" }}
        aria-hidden="true"
      />
      <span className="text-xs font-display font-semibold text-secondary tracking-wide">
        Engine thinking…
      </span>
    </output>
  );
}
