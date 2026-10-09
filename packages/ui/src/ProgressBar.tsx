import { cn } from "./cn";

export interface ProgressBarProps {
  /** Сколько пройдено (например, номер текущего вопроса). */
  current: number;
  total: number;
  label?: string;
  className?: string;
}

export function ProgressBar({ current, total, label, className }: ProgressBarProps) {
  const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex justify-between text-sm font-bold text-muted">
        <span>{label}</span>
        <span>
          {current} / {total}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label={label ?? "Прогресс"}
        className="h-2.5 overflow-hidden rounded-full bg-surface"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange to-lime transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
