"use client";

// «Твоя палитра» 🎨: градиент из цвета итога и второго по баллам (второй показываем всегда), строка о том, что добавляет второй,
// и полоска «Из чего ты состоишь» с долями всех цветов. Цвета берутся из result.acc; порядок при ничьей — по хэшу (order в адресе).
import { useSearchParams } from "next/navigation";
import type { Test } from "@gazgame/content";
import { decodeOrder, ORDER_KEY } from "@gazgame/engine";
import { rankingFromQuery, sideScoreFromQuery } from "@/lib/result-query";
import { FillBar } from "./FillBar";

export function Palette({ test, resultId }: { test: Test; resultId: string }) {
  const params = useSearchParams();
  const ranking = test.palette ? rankingFromQuery(test, params, { resultId }) : null;
  if (!test.palette || !ranking) return null;
  const order = decodeOrder(test, sideScoreFromQuery(params, ORDER_KEY, 8) ?? -1);
  const rows = order ? order.flatMap((id) => ranking.filter((r) => r.result.id === id)) : ranking;
  const [main, second] = rows;
  if (!main || !second) return null;
  const from = main.result.acc ?? "#FF5A1F";
  const to = second.result.acc ?? "#D4FF3A";

  return (
    <section aria-labelledby="palette-title" className="flex flex-col gap-3 rounded-card bg-surface p-5">
      <h2 id="palette-title" className="font-display text-xl font-bold">
        {test.palette.title}
      </h2>
      <div
        className="flex flex-col items-center gap-2 rounded-2xl px-4 py-7 text-center"
        style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})`, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)" }}
      >
        <div aria-hidden="true" className="text-5xl leading-none">
          {main.result.emoji} {second.result.emoji}
        </div>
        <p className="rounded-full bg-bg/80 px-3.5 py-1 text-sm font-extrabold text-cream">
          {main.result.title} + {second.result.title}
        </p>
      </div>
      {second.result.asSecond && <p className="leading-relaxed text-cream/85">{second.result.asSecond}</p>}
      <h3 className="mt-1 font-display text-base font-bold">{test.palette.barTitle}</h3>
      <div
        role="img"
        aria-label={rows.map((r) => `${r.result.title} ${r.percent}%`).join(", ")}
        className="flex h-4 overflow-hidden rounded-full bg-surface-2"
      >
        {rows.map((r) => (
          <div
            key={r.result.id}
            className="h-full"
            style={{
              width: `${r.percent}%`,
              backgroundColor: r.result.acc,
              ...(r.result.accBorder ? { boxShadow: `inset 0 0 0 1px ${r.result.accBorder}` } : {}),
            }}
          >
            <FillBar percent={100} className="bg-transparent" />
          </div>
        ))}
      </div>
      <ul className="flex flex-col gap-1.5">
        {rows.map((r) => (
          <li key={r.result.id} className="flex items-center justify-between gap-3 text-[15px]">
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: r.result.acc, ...(r.result.accBorder ? { boxShadow: `0 0 0 1px ${r.result.accBorder}` } : {}) }}
              />
              {r.result.title}
            </span>
            <span className="font-bold text-muted tabular-nums">{r.percent}%</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
