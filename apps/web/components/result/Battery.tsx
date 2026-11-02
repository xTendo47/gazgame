"use client";

// «Твоя соц-батарейка 🔋»: большая батарейка, заполнение = сумма баллов / максимум (анимация зарядки от нуля).
// Сумма читается из адреса страницы (баллы шкал); подпись берёт часы из result.battery.
import { useSearchParams } from "next/navigation";
import type { Test } from "@gazgame/content";
import { scalesFromQuery } from "@/lib/result-query";
import { FillBar } from "./FillBar";
import { Em } from "@/components/Em";

export function Battery({ test, hours }: { test: Test; hours?: string }) {
  const breakdown = scalesFromQuery(test, useSearchParams());
  if (!test.battery || !breakdown) return null;
  const percent = Math.round((breakdown.total / breakdown.totalMax) * 100);

  return (
    <section aria-labelledby="battery-title" className="flex flex-col gap-3 rounded-card bg-surface p-5">
      <h2 id="battery-title" className="font-display text-xl font-bold">
        <Em text={test.battery.title} />
      </h2>
      <div className="flex items-center">
        <div
          role="meter"
          aria-label={test.battery.title}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-valuetext={`${percent}%`}
          className="h-16 flex-1 overflow-hidden rounded-xl border-4 border-cream/70 bg-surface-2 p-1"
        >
          <div className="h-full overflow-hidden rounded-md">
            <FillBar percent={percent} className="rounded-md bg-lime" />
          </div>
        </div>
        <div aria-hidden="true" className="h-8 w-2.5 rounded-r-md bg-cream/70" />
      </div>
      <p className="font-display text-lg leading-snug font-bold text-balance">
        {hours ? test.battery.caption.replace("{hours}", hours) : test.battery.caption.replace(/\s*~?\{hours\}/, "")}
      </p>
    </section>
  );
}
