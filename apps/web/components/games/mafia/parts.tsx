"use client";

// Мелкие части «Мафии», которые берёт и «Шпион»: степпер числа и строки «под замком 💎».
import { Lock, Minus, Plus } from "lucide-react";
import { Badge, Button, cn } from "@gazgame/ui";

export function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  big = false,
  format = String,
  step = 1,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  big?: boolean;
  /** Как показать число, например 420 → «7:00». */
  format?: (n: number) => string;
  step?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Button variant="ghost" size="md" className="w-14 bg-surface-2" aria-label={`${label}: меньше`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}>
        <Minus aria-hidden="true" />
      </Button>
      <output aria-label={label} className={cn("text-center font-display font-black tabular-nums", big ? "text-6xl" : "text-2xl")}>
        {format(value)}
      </output>
      <Button variant="ghost" size="md" className="w-14 bg-surface-2" aria-label={`${label}: больше`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}>
        <Plus aria-hidden="true" />
      </Button>
    </div>
  );
}

/** Роли, темы или наборы по подписке: видно, нажатие ведёт на «Глубже 💎». */
export function LockedExtras({
  extras,
  lockedText,
  onOpen,
}: {
  extras: readonly { emoji: string; title: string }[];
  lockedText: string;
  onOpen: () => void;
}) {
  if (extras.length === 0) return null;
  return (
    <section aria-label="Под замком" className="flex flex-col gap-2">
      {extras.map((extra) => (
        <button
          key={extra.title}
          type="button"
          onClick={onOpen}
          aria-label={`${extra.title} — закрыто: ${lockedText}`}
          className="diamond-glow flex min-h-14 items-center gap-3 rounded-card bg-surface px-4 py-2 text-left"
        >
          <span aria-hidden="true" className="w-8 text-center text-2xl">
            {extra.emoji}
          </span>
          <span className="flex-1 font-semibold">{extra.title}</span>
          <Badge tone="premium">
            <Lock aria-hidden="true" size={12} /> {lockedText}
          </Badge>
        </button>
      ))}
    </section>
  );
}
