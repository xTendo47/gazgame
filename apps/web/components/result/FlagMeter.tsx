"use client";

// «Флаг-метр» 🚩💚: полоска «зелёный / красный» и подпись по диапазону. Сумма приходит в адресе результата (?flag=17).
import { useSearchParams } from "next/navigation";
import type { Test } from "@gazgame/content";
import { FLAG_KEY, flagMeterOf } from "@gazgame/engine";
import { sideScoreFromQuery } from "@/lib/result-query";
import { FillBar } from "./FillBar";
import { Em } from "@/components/Em";

export function FlagMeter({ test }: { test: Test }) {
  const sum = sideScoreFromQuery(useSearchParams(), FLAG_KEY);
  const meter = sum === null ? null : flagMeterOf(test, sum);
  if (!test.flagMeter || !meter) return null;
  const { red, green, band } = meter;

  return (
    <section aria-labelledby="flag-meter-title" className="flex flex-col gap-3 rounded-card bg-surface p-5">
      <h2 id="flag-meter-title" className="font-display text-xl font-bold">
        <Em text={test.flagMeter.title} />
      </h2>
      <div className="flex items-baseline justify-between gap-3 font-display text-lg font-extrabold">
        <span>{green}%</span>
        <span><Em text="🚩" /> {red}%</span>
      </div>
      <div
        role="meter"
        aria-label={test.flagMeter.title}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={red}
        aria-valuetext={`Зелёного ${green}%, красного ${red}%`}
        className="flex h-4 overflow-hidden rounded-full bg-surface-2"
      >
        <div className="h-full" style={{ width: `${green}%` }}>
          <FillBar percent={100} className="bg-lime" />
        </div>
        <div className="h-full" style={{ width: `${red}%` }}>
          <FillBar percent={100} className="bg-[#FF4D4D]" />
        </div>
      </div>
      <p className="font-display text-lg leading-tight font-bold">
        {band.title} {band.emoji}
      </p>
      <p className="leading-relaxed text-cream/85">{band.text}</p>
    </section>
  );
}
