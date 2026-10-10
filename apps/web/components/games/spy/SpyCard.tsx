"use client";

// Лица карт «Шпиона» в той же форме, что карты «Мафии» (рубашка общая — CardBack).
// Карта со словом светлая, карта шпиона тёмно-красная (как мафия). Длинные слова уменьшаются, чтобы влезть в карту на 360px.
import type { ReactNode } from "react";
import { cn } from "@gazgame/ui";
import { CARD_SHAPE } from "../mafia/RoleCard";

/** Размер слова по самому длинному слову: «Великобритания» должна влезть в одну строку. */
function titleSize(title: string): string {
  const longest = Math.max(...title.split(/\s+/).map((w) => w.length));
  if (longest <= 6) return "text-3xl";
  if (longest <= 9) return "text-2xl";
  if (longest <= 12) return "text-xl";
  return "text-lg";
}

function Face({
  emoji,
  title,
  hint,
  tone,
  className,
}: {
  emoji: string;
  title: string;
  hint?: ReactNode;
  tone: "word" | "spy";
  className?: string;
}) {
  return (
    <div
      className={cn(
        CARD_SHAPE,
        "flex flex-col items-center justify-center gap-3 px-5 text-center",
        tone === "spy" ? "bg-[#B3132B] text-cream" : "bg-cream text-bg",
        className,
      )}
    >
      <span aria-hidden="true" className="absolute top-3 left-4 text-xl">
        {emoji}
      </span>
      <span aria-hidden="true" className="absolute right-4 bottom-3 rotate-180 text-xl">
        {emoji}
      </span>
      <span aria-hidden="true" className="text-7xl leading-none">
        {emoji}
      </span>
      <span lang="ru" className={cn("w-full font-display font-black leading-tight text-balance", titleSize(title))}>
        {title}
      </span>
      {hint && <p className="text-[14px] font-semibold leading-snug opacity-80">{hint}</p>}
    </div>
  );
}

export function WordCardFace({ emoji, title, hint, className }: { emoji: string; title: string; hint?: string; className?: string }) {
  return <Face tone="word" emoji={emoji} title={title} hint={hint} className={className} />;
}

export function SpyCardFace({ title, hint, className }: { title: string; hint?: string; className?: string }) {
  return <Face tone="spy" emoji="🕵️" title={title} hint={hint} className={className} />;
}
