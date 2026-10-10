"use client";

// Все типы теста полосками от сильного к слабому (scoring.showRanking).
// Баллы берутся из адреса страницы — см. lib/result-query.ts.
import { useSearchParams } from "next/navigation";
import type { Test } from "@gazgame/content";
import { cn } from "@gazgame/ui";
import { rankingFromQuery } from "@/lib/result-query";
import { FillBar } from "./FillBar";

export function RankingPanel({ test, resultId, blendId }: { test: Test; resultId: string; blendId?: string }) {
  const ranking = rankingFromQuery(test, useSearchParams(), { resultId, blendId });
  if (!ranking) return null;

  return (
    <section aria-labelledby="ranking-title" className="flex flex-col gap-4 rounded-card bg-surface p-5">
      <h2 id="ranking-title" className="font-display text-xl font-bold">
        Твой расклад 📊
      </h2>
      <ol className="flex flex-col gap-3.5">
        {ranking.map(({ result, score, max }, i) => {
          const percent = max > 0 ? Math.round((score / max) * 100) : 0;
          return (
            <li key={result.id} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className={cn("flex items-center gap-2", i === 0 ? "font-extrabold" : "font-semibold text-cream/85")}>
                  <span aria-hidden="true" className="text-xl">
                    {result.emoji}
                  </span>
                  {result.title}
                </span>
                <span className="shrink-0 text-sm font-bold text-muted tabular-nums">{percent}%</span>
              </div>
              <div
                role="meter"
                aria-label={result.title}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-valuenow={score}
                aria-valuetext={`${i + 1}-е место, ${percent}%`}
                className="h-3 overflow-hidden rounded-full bg-surface-2"
              >
                <FillBar
                  percent={percent}
                  delay={i * 0.06}
                  className={i === 0 ? "bg-orange" : i === 1 ? "bg-lime" : "bg-cream/35"}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
