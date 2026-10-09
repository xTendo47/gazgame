import type { ReactNode } from "react";
import { cn } from "./cn";

export type BadgeTone = "draft" | "premium" | "soon" | "neutral";

const TONES: Record<BadgeTone, string> = {
  draft: "border border-dashed border-muted text-muted",
  premium: "bg-lime text-bg",
  soon: "bg-surface-2 text-cream",
  neutral: "border border-line text-muted",
};

export function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold", TONES[tone], className)}
    >
      {children}
    </span>
  );
}
