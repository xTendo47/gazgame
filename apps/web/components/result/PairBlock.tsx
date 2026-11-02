"use client";

// «Город-пара» 🏙: всегда показываем второй по баллам итог — «А ещё тебе подойдёт: …» с его коротким текстом (result.asSecond).
// Порядок при ничьей — по хэшу ответов (order в адресе).
import { useSearchParams } from "next/navigation";
import type { Test } from "@gazgame/content";
import { decodeOrder, ORDER_KEY } from "@gazgame/engine";
import { rankingFromQuery, sideScoreFromQuery } from "@/lib/result-query";
import { Glyph } from "@/components/casino/GIcon";

export function PairBlock({ test, resultId }: { test: Test; resultId: string }) {
  const params = useSearchParams();
  const ranking = test.pairBlock ? rankingFromQuery(test, params, { resultId }) : null;
  if (!test.pairBlock || !ranking) return null;
  const order = decodeOrder(test, sideScoreFromQuery(params, ORDER_KEY, 8) ?? -1);
  const second = (order ? order.flatMap((id) => ranking.filter((r) => r.result.id === id)) : ranking)[1];
  if (!second) return null;

  return (
    <section aria-labelledby="pair-title" className="flex flex-col gap-2 rounded-card border-l-4 border-lime bg-surface p-5">
      <h2 id="pair-title" className="font-display text-lg leading-tight font-bold">
        {test.pairBlock.title}: {second.result.title} <span aria-hidden="true"><Glyph emoji={second.result.emoji} size="1em" /></span>
      </h2>
      {second.result.asSecond && <p className="leading-relaxed text-cream/85">{second.result.asSecond}</p>}
    </section>
  );
}
