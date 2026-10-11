"use client";

// Точная ничья первых двух типов: «Ничья: ты поровну {A} и {B}» над процентами.
// Баллы — из адреса страницы (lib/result-query.ts). Нет баллов или нет ничьей — ничего не показываем.
import { useSearchParams } from "next/navigation";
import type { Test } from "@gazgame/content";
import { isTopTie, type RankedType } from "@gazgame/engine";
import { rankingFromQuery } from "@/lib/result-query";

export function tieText(ranking: readonly RankedType[]): string {
  const [a, b] = ranking;
  return `Ничья: ты поровну ${a?.result.title} и ${b?.result.title}`;
}

export function TieNote({ ranking }: { ranking: readonly RankedType[] }) {
  return (
    <p role="status" className="rounded-card border border-lime/60 bg-lime/10 px-4 py-2.5 text-center text-[15px] font-bold text-lime">
      ⚖️ {tieText(ranking)}
    </p>
  );
}

/** Для тестов без «Твоего расклада» (например, Темперамент): плашка отдельно, под героем. */
export function TieBanner({ test, resultId, blendId }: { test: Test; resultId: string; blendId?: string }) {
  const ranking = rankingFromQuery(test, useSearchParams(), { resultId, blendId });
  if (!ranking || !isTopTie(ranking)) return null;
  return <TieNote ranking={ranking} />;
}
