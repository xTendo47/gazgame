"use client";

// SVG-алмаз Премиума из макета: грани голубых оттенков, свечение, покачивание и блик по граням раз в ~4,6 с.
// flash — вспышка при включении Премиума. Анимации в globals.css, при «Уменьшить движение» выключены.
import { useId } from "react";
import { cn } from "@gazgame/ui";

const OUTLINE = "22,18 78,18 96,40 50,92 4,40";

export function Gem({ size = 96, flash = false, className }: { size?: number; flash?: boolean; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      className={cn("premium-gem", flash && "premium-gem-flash", className)}
    >
      <defs>
        <linearGradient id={`${id}g1`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E8FAFF" />
          <stop offset="1" stopColor="#62D2FF" />
        </linearGradient>
        <linearGradient id={`${id}g2`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9BE4FF" />
          <stop offset="1" stopColor="#1F8FD0" />
        </linearGradient>
        <linearGradient id={`${id}shine`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}clip`}>
          <polygon points={OUTLINE} />
        </clipPath>
      </defs>
      <polygon points={OUTLINE} fill={`url(#${id}g2)`} />
      <polygon points="22,18 50,18 36,40 4,40" fill="#CFF3FF" />
      <polygon points="50,18 78,18 96,40 64,40" fill="#7FD8FF" />
      <polygon points="36,40 64,40 50,18" fill={`url(#${id}g1)`} />
      <polygon points="4,40 36,40 50,92" fill="#3AAEE8" />
      <polygon points="36,40 64,40 50,92" fill="#62D2FF" />
      <polygon points="64,40 96,40 50,92" fill="#1F8FD0" />
      {/* блик: светлая полоса проходит по граням */}
      <g clipPath={`url(#${id}clip)`}>
        <rect className="premium-glint" x="20" y="0" width="22" height="100" fill={`url(#${id}shine)`} />
      </g>
    </svg>
  );
}
