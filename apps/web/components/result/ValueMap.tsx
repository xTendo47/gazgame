"use client";

// «Твоя карта ценностей»: все типы полосками (баллы / outOf), топ-N подсвечен. Порядок при ничьей — по хэшу ответов,
// он приходит в адресе вместе с баллами (?order=…, см. engine ORDER_KEY).
import { useSearchParams } from "next/navigation";
import type { Test } from "@gazgame/content";
import { decodeOrder, ORDER_KEY } from "@gazgame/engine";
import { cn } from "@gazgame/ui";
import { rankingFromQuery, sideScoreFromQuery } from "@/lib/result-query";
import { FillBar } from "./FillBar";

export function ValueMap({ test, resultId }: { test: Test; resultId: string }) {
  const params = useSearchParams();
  const map = test.valueMap;
  const ranking = map ? rankingFromQuery(test, params, { resultId }) : null;
  if (!map || !ranking) return null;
  // порядок из адреса (ничьи уже разведены хэшем); нет — как в расчёте по баллам
  const order = decodeOrder(test, sideScoreFromQuery(params, ORDER_KEY, 8) ?? -1);
  const rows = order ? order.flatMap((id) => ranking.filter((r) => r.result.id === id)) : ranking;

  return (
    <section aria-labelledby="value-map-title" className="flex flex-col gap-4 rounded-card bg-surface p-5">
      <h2 id="value-map-title" className="font-display text-xl font-bold">
        {map.title}
      </h2>
      <ol className="flex flex-col gap-3.5">
        {rows.map(({ result, score }, i) => {
          const isTop = i < map.top;
          return (
            <li key={result.id} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className={cn("flex items-center gap-2", isTop ? "font-extrabold" : "font-semibold text-cream/70")}>
                  <span aria-hidden="true" className="text-xl">
                    {result.emoji}
                  </span>
                  {result.title}
                </span>
                <span className="shrink-0 text-sm font-bold text-muted tabular-nums">
                  {score}/{map.outOf}
                </span>
              </div>
              <div
                role="meter"
                aria-label={result.title}
                aria-valuemin={0}
                aria-valuemax={map.outOf}
                aria-valuenow={score}
                aria-valuetext={`${i + 1}-е место, ${score} из ${map.outOf}${isTop ? ", в топе" : ""}`}
                className="h-3 overflow-hidden rounded-full bg-surface-2"
              >
                <FillBar percent={(score / map.outOf) * 100} delay={i * 0.06} className={isTop ? "bg-orange" : "bg-cream/35"} />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
