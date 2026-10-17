"use client";

// Карточка «Продолжить» на главной: только если есть незаконченный тест. Эмодзи теста, «Продолжить: …», «Вопрос 7 из 12»,
// полоска прогресса и «Дальше →». Нет незаконченного теста — карточки нет. Ответы лежат на устройстве (ProgressStore.testProgress).
import { useMemo, useSyncExternalStore } from "react";
import { pickContinue, type ContinueTest, type TestProgress } from "@gazgame/engine";
import { getProgress } from "@/lib/progress";
import { TrackedLink } from "./TrackedLink";

/** Тест в лёгком виде: на главную не нужны тексты вопросов, только их число и число вариантов. */
export interface ContinueTestSummary {
  id: string;
  slug: string;
  title: string;
  emoji: string;
  /** Сколько вариантов у каждого вопроса по порядку. */
  options: number[];
}

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener); // тест продолжили в другой вкладке
  return () => window.removeEventListener("storage", listener);
}

export function ContinueCard({ tests }: { tests: ContinueTestSummary[] }) {
  // Снимок — строка: React не перерисовывает, пока ответы не поменялись
  const snapshot = useSyncExternalStore(subscribe, () => JSON.stringify(getProgress().listTestProgress()), () => "{}");
  const pick = useMemo(() => {
    const full: ContinueTest[] = tests.map((t) => ({ ...t, questions: t.options.map((n) => ({ options: Array.from({ length: n }) })) }));
    return pickContinue(full, JSON.parse(snapshot) as Record<string, TestProgress>);
  }, [tests, snapshot]);

  if (!pick) return null;
  const { test, question, total } = pick;
  return (
    <TrackedLink
      href={`/test/${test.slug}`}
      track={{ kind: "home", target: "continue" }}
      className="gaz-press flex min-h-14 w-full items-center gap-3 rounded-[18px] border border-line bg-surface px-3.5 py-2.5 text-left"
    >
      <span aria-hidden="true" className="text-2xl leading-none">
        {test.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <b className="block font-display text-[13.5px] leading-tight font-semibold">Продолжить: {test.title}</b>
        <small className="block text-xs text-muted tabular-nums">
          Вопрос {question} из {total}
        </small>
        <span aria-hidden="true" className="mt-1.5 block h-1 overflow-hidden rounded bg-line">
          <i className="block h-full rounded bg-[#B58CFF]" style={{ width: `${Math.round((question / total) * 100)}%` }} />
        </span>
      </span>
      <span className="font-display text-xs font-extrabold whitespace-nowrap text-[#B58CFF]">Дальше →</span>
    </TrackedLink>
  );
}
