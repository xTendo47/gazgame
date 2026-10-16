"use client";

// Экран-вспышка награды: «Новая карта в Коллекции 🃏» и кнопка «Смотреть». Показывается, пока награду не закрыли
// (переживает перезагрузку). Коллекции ещё нет, поэтому «Смотреть» закрывает вспышку: карта уже лежит на устройстве.
import { useEffect, useRef, type CSSProperties } from "react";
import type { TodayFile } from "@gazgame/content";
import { dismissReward } from "@gazgame/engine";
import { updateToday, useTodayData } from "@/lib/today";

const SPARKS = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * Math.PI * 2;
  const dist = 80 + (i % 3) * 30;
  return {
    dx: `${Math.round(Math.cos(angle) * dist)}px`,
    dy: `${Math.round(Math.sin(angle) * dist)}px`,
    color: ["#FF5A1F", "#D4FF3A", "#FFC83A"][i % 3] as string,
  };
});

export function RewardFlash({ ladder }: { ladder: TodayFile["ladder"] }) {
  const data = useTodayData();
  const button = useRef<HTMLButtonElement>(null);
  const step = data.pendingReward ? ladder.find((s) => s.card?.id === data.pendingReward) : undefined;

  useEffect(() => {
    if (step) button.current?.focus();
  }, [step]);

  if (!step?.card) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Новая карта в Коллекции" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6">
      <div className="today-pop relative flex w-full max-w-[360px] flex-col items-center gap-2 overflow-hidden rounded-3xl border border-orange bg-[linear-gradient(160deg,#2B2430,#1C1920)] p-6 text-center shadow-[0_0_40px_rgb(255_90_31/0.4)]">
        {SPARKS.map((s, i) => (
          <i
            key={i}
            aria-hidden="true"
            className="gaz-spark"
            style={{ "--dx": s.dx, "--dy": s.dy, background: s.color, boxShadow: `0 0 8px ${s.color}` } as CSSProperties}
          />
        ))}
        <span aria-hidden="true" className="text-[72px] leading-none">
          {step.emoji}
        </span>
        <b className="font-display text-xl font-extrabold">Новая карта в Коллекции 🃏</b>
        <p className="text-[15px] text-muted">
          {step.card.title}
          {step.freeze ? " и заморозка ❄️" : ""}
        </p>
        <button
          ref={button}
          type="button"
          onClick={() => updateToday(dismissReward)}
          className="gaz-press mt-3 min-h-12 w-full rounded-2xl bg-lime px-4 py-3 font-display text-base font-extrabold text-bg"
        >
          Смотреть
        </button>
      </div>
    </div>
  );
}
