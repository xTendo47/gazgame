"use client";

// «Твой расклад»: два первых результата с полосками — «Твой итог: …» и «а ещё …».
// Для любопытных — «Развернуть»: все результаты от сильного к слабому (scoring.showRanking).
// Баллы берутся из адреса страницы — см. lib/result-query.ts.
import { useId, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Test } from "@gazgame/content";
import { cn } from "@gazgame/ui";
import { rankingFromQuery } from "@/lib/result-query";
import { FillBar } from "./FillBar";

export function RankingPanel({ test, resultId, blendId }: { test: Test; resultId: string; blendId?: string }) {
  const ranking = rankingFromQuery(test, useSearchParams(), { resultId, blendId });
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  if (!ranking) return null;
  const shown = expanded ? ranking : ranking.slice(0, 2);

  return (
    <section aria-labelledby="ranking-title" className="flex flex-col gap-4 rounded-card bg-surface p-5">
      <h2 id="ranking-title" className="font-display text-xl font-bold">
        Твой расклад 📊
      </h2>
      <ol id={listId} className="flex flex-col gap-3.5">
        {shown.map(({ result, score, max, percent }, i) => {
          // подпись — доля в сумме 100 (как на карточке для шеринга), полоска — сколько набрано из возможного
          const fill = max > 0 ? Math.round((score / max) * 100) : 0;
          const prefix = i === 0 ? "Твой итог:" : i === 1 ? "а ещё" : null;
          return (
            <li key={result.id} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className={cn("flex flex-wrap items-center gap-x-2", i === 0 ? "font-extrabold" : "font-semibold text-cream/85")}>
                  {prefix && <span className={i === 0 ? "text-cream" : "text-muted"}>{prefix}</span>}
                  <span>
                    {result.title}{" "}
                    <span aria-hidden="true" className="text-xl">
                      {result.emoji}
                    </span>
                  </span>
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
                  percent={fill}
                  delay={i * 0.06}
                  className={i === 0 ? "bg-orange" : i === 1 ? "bg-lime" : "bg-cream/35"}
                />
              </div>
            </li>
          );
        })}
      </ol>
      {ranking.length > 2 && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded(!expanded)}
          className="-mb-1 min-h-11 self-center rounded-full px-4 text-sm font-semibold text-muted transition hover:text-cream"
        >
          {expanded ? "Свернуть" : "Развернуть"}
        </button>
      )}
    </section>
  );
}
