"use client";

// Игральная карта «Мафии»: рубашка (тёмная, «GAZ GAME», оранжевая рамка) и лицо с ролью.
// Цвет лица: мафия — красная, мирный — светлая, остальной город — салатовая, ведущий — оранжевая.
import type { CSSProperties } from "react";
import type { MafiaRole } from "@gazgame/content";
import { cn } from "@gazgame/ui";

const FACE: Record<"mafia" | "civilian" | "city" | "host", string> = {
  // тёмно-красная со светлым текстом (контраст ~5.9:1), чтобы не путать с оранжевым ведущим
  mafia: "bg-[#B3132B] text-cream",
  civilian: "bg-cream text-bg",
  city: "bg-lime text-bg",
  host: "bg-orange text-bg",
};

export function faceStyle(role: MafiaRole): string {
  if (role.side === "mafia") return FACE.mafia;
  if (role.side === "host") return FACE.host;
  return role.auto ? FACE.civilian : FACE.city;
}

export const CARD_SHAPE = "relative aspect-[5/7] w-full max-w-64 rounded-[22px] shadow-[0_18px_40px_rgb(0_0_0/0.45)]";

export function CardBack({ label, className, style }: { label: string; className?: string; style?: CSSProperties }) {
  const [first, ...rest] = label.split(" ");
  return (
    <div
      aria-hidden="true"
      className={cn(CARD_SHAPE, "flex items-center justify-center border-4 border-orange bg-bg", className)}
      style={style}
    >
      <div className="absolute inset-3 rounded-[14px] border border-orange/40" />
      <div className="flex flex-col items-center font-display text-4xl font-black leading-[0.95] tracking-tight">
        <span className="text-cream">{first}</span>
        <span className="text-orange">{rest.join(" ")}</span>
      </div>
    </div>
  );
}

export function CardFace({ role, compact = false, className }: { role: MafiaRole; compact?: boolean; className?: string }) {
  return (
    <div className={cn(CARD_SHAPE, "flex flex-col items-center justify-center gap-2 px-6 text-center", faceStyle(role), className)}>
      <span aria-hidden="true" className="absolute top-3 left-4 text-xl">
        {role.emoji}
      </span>
      <span aria-hidden="true" className="absolute right-4 bottom-3 rotate-180 text-xl">
        {role.emoji}
      </span>
      <span aria-hidden="true" className={compact ? "text-5xl" : "text-7xl"}>
        {role.emoji}
      </span>
      <span className={cn("font-display font-black leading-tight", compact ? "text-xl" : "text-2xl")}>{role.title}</span>
      <p className={cn("leading-snug font-semibold", compact ? "text-[13px]" : "text-[15px]")}>{role.text}</p>
    </div>
  );
}
