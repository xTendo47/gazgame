"use client";

// Шкалы на экране результата: эмодзи, полоска, уровень и текст зоны,
// затем «Твоя опора» и «Твоя зона роста» (или «ровный профиль»).
// Баллы берутся из адреса страницы — см. lib/result-query.ts.
// Тест может переименовать блок, уровни и цвета (test.scalesPanel), спрятать его или добавить советы к самой сильной шкале.
import { useSearchParams } from "next/navigation";
import type { Test } from "@gazgame/content";
import type { ScaleScore } from "@gazgame/engine";
import { cn } from "@gazgame/ui";
import { scalesFromQuery } from "@/lib/result-query";
import { FillBar } from "./FillBar";

const LEVEL_LABELS: Record<string, string> = { low: "низкий", mid: "средний", high: "высокий" };
const LEVEL_BARS: Record<string, string> = { low: "bg-orange", mid: "bg-gradient-to-r from-orange to-lime", high: "bg-lime" };
const TONE_BARS = { good: "bg-lime", warn: "bg-[#FFC83D]", bad: "bg-[#FF4D4D]" } as const;

type LevelView = NonNullable<NonNullable<Test["scalesPanel"]>["levels"]>[string];

export function ScalesPanel({ test, range }: { test: Test; range?: readonly [number, number] }) {
  const breakdown = scalesFromQuery(test, useSearchParams(), range);
  const panel = test.scalesPanel;
  if (!breakdown || panel?.hidden) return null;
  const { scales, profile } = breakdown;
  const blocks = test.profileBlocks;
  // самая сильная шкала (при равенстве первая по порядку) — для советов «Что помогает именно тебе»
  const top = scales.reduce((best, s) => (s.score > best.score ? s : best));
  const tips = panel?.tips && top.score > 0 ? panel.tips.byScale[top.scale.id] : undefined;

  return (
    <>
      <section aria-labelledby="scales-title" className="flex flex-col gap-4 rounded-card bg-surface p-5">
        <h2 id="scales-title" className="font-display text-xl font-bold">
          {panel?.title ?? "Твои шкалы 📊"}
        </h2>
        {scales.map((s) => (
          <ScaleRow key={s.scale.id} item={s} view={s.level ? panel?.levels?.[s.level] : undefined} />
        ))}
      </section>

      {panel?.tips && tips && (
        <section aria-labelledby="scales-tips-title" className="flex flex-col gap-3 rounded-card border-l-4 border-lime bg-surface p-5">
          <h2 id="scales-tips-title" className="font-display text-lg font-bold leading-tight">
            {panel.tips.title} <span aria-hidden="true">{top.scale.emoji}</span>
          </h2>
          <ul className="flex flex-col gap-2">
            {tips.map((tip) => (
              <li key={tip} className="flex gap-3 leading-[1.5]">
                <span aria-hidden="true" className="flex h-[1.5em] shrink-0 items-center">
                  <span className="size-2 rounded-full bg-lime" />
                </span>
                <span className="min-w-0 text-cream/85">{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {blocks && profile.kind === "peaks" && (
        <div className="grid grid-cols-2 gap-3">
          <PeakCard label={blocks.strongest} item={profile.strongest} accent="border-lime" />
          <PeakCard label={blocks.weakest} item={profile.weakest} accent="border-orange" />
        </div>
      )}
      {blocks && profile.kind === "flat" && (
        <section className="rounded-card border border-line p-5">
          <h2 className="mb-2 font-display text-lg font-bold">Ровный профиль ⚖️</h2>
          <p className="leading-relaxed text-cream/85">{blocks.flatProfile}</p>
        </section>
      )}
    </>
  );
}

function ScaleRow({ item, view }: { item: ScaleScore; view?: LevelView }) {
  const { scale, score, level, zone } = item;
  const percent = Math.round((score / scale.max) * 100);
  const levelLabel = view ? `${view.emoji ? `${view.emoji} ` : ""}${view.label}` : level && LEVEL_LABELS[level];
  const levelSpeech = view?.label ?? (level && LEVEL_LABELS[level]);
  const bar = view ? TONE_BARS[view.tone] : ((level && LEVEL_BARS[level]) ?? "bg-cream");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-2 font-bold">
          <span aria-hidden="true" className="text-xl">
            {scale.emoji}
          </span>
          {scale.title}
        </span>
        <span className="shrink-0 text-sm font-bold text-muted">
          {score}/{scale.max}
          {levelLabel && ` · ${levelLabel}`}
        </span>
      </div>
      <div
        role="meter"
        aria-label={scale.title}
        aria-valuemin={0}
        aria-valuemax={scale.max}
        aria-valuenow={score}
        aria-valuetext={`${score} из ${scale.max}${levelSpeech ? `, ${levelSpeech}${view ? "" : " уровень"}` : ""}`}
        className="h-3 overflow-hidden rounded-full bg-surface-2"
      >
        <FillBar percent={percent} className={bar} />
      </div>
      {zone && <p className="text-[15px] leading-relaxed text-cream/80">{zone}</p>}
    </div>
  );
}

function PeakCard({ label, item, accent }: { label: string; item: ScaleScore; accent: string }) {
  return (
    <section className={cn("flex flex-col gap-1 rounded-card border-2 bg-surface p-4", accent)}>
      <h2 className="text-xs font-extrabold uppercase tracking-wide text-muted">{label}</h2>
      <div aria-hidden="true" className="text-3xl">
        {item.scale.emoji}
      </div>
      <p className="font-display text-base font-bold leading-tight">{item.scale.title}</p>
    </section>
  );
}
