import { Input } from "@/components/ui/input";

interface PlayerNameInputProps {
  color: "white" | "black";
  value: string;
  onChange: (name: string) => void;
  disabled?: boolean;
}

const COLOR_CONFIG = {
  white: {
    label: "Player 1",
    dotClass: "bg-foreground border border-border/60",
    inputId: "input-white-name",
  },
  black: {
    label: "Player 2",
    dotClass: "bg-muted-foreground/70",
    inputId: "input-black-name",
  },
} as const;

export function PlayerNameInput({
  color,
  value,
  onChange,
  disabled = false,
}: PlayerNameInputProps) {
  const { label, dotClass, inputId } = COLOR_CONFIG[color];

  return (
    <div
      className={`flex flex-col gap-0.5 min-w-0 ${disabled ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-1">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotClass}`} />
        <label
          htmlFor={inputId}
          className={`text-[10px] font-display font-semibold text-muted-foreground uppercase tracking-wider leading-none ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
        >
          {label}
        </label>
      </div>
      <Input
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={color === "white" ? "Player White" : "Player Black"}
        className={`h-7 text-xs font-body w-28 bg-background/50 border-border/60 focus:border-primary/60 text-foreground placeholder:text-muted-foreground/50 ${disabled ? "cursor-not-allowed" : ""}`}
        maxLength={20}
        disabled={disabled}
        aria-label={`${label} name`}
        data-ocid={inputId}
      />
    </div>
  );
}
