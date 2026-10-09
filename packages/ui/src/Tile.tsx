import type { ReactNode } from "react";
import { cn } from "./cn";

export type TileAccent = "orange" | "lime" | "cream" | "none";

const ACCENTS: Record<TileAccent, string> = {
  orange: "border-l-orange",
  lime: "border-l-lime",
  cream: "border-l-cream",
  none: "border-l-transparent",
};

export interface TileProps {
  emoji: string;
  title: string;
  subtitle?: string;
  accent?: TileAccent;
  /** Значок справа: «скоро», «черновик», 💎 и т.п. */
  badge?: ReactNode;
  size?: "lg" | "md";
  dimmed?: boolean;
  className?: string;
}

/**
 * Карточка-плитка: эмодзи, заголовок, подпись.
 * Сама не ссылка — оберни её в <Link className="block">, чтобы сделать кликабельной.
 */
export function Tile({ emoji, title, subtitle, accent = "orange", badge, size = "lg", dimmed, className }: TileProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-card border-l-[6px] bg-surface transition",
        "group-hover:bg-surface-2 group-active:scale-[0.98]",
        size === "lg" ? "p-5" : "p-4",
        ACCENTS[accent],
        dimmed && "opacity-60",
        className,
      )}
    >
      <span aria-hidden="true" className={cn("leading-none", size === "lg" ? "text-4xl" : "text-3xl")}>
        {emoji}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={cn("font-display font-bold leading-tight", size === "lg" ? "text-xl" : "text-base")}>
          {title}
        </span>
        {subtitle && <span className="text-[15px] leading-snug text-muted">{subtitle}</span>}
      </span>
      {badge}
    </div>
  );
}
