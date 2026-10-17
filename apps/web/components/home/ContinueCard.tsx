"use client";

// Карточка «Продолжить» на главной: последний незаконченный тест («Вопрос 7 из 12», полоска прогресса) или игра, которую открыли
// и не доиграли («Игра не закончена»; ход игры не сохраняется, «Дальше →» начинает заново). Нет незаконченного — карточки нет.
// Всё на устройстве (ProgressStore: testProgress и gameStarted).
import { useMemo, useSyncExternalStore } from "react";
import { pickContinue, type ContinueGame, type ContinueTest, type TestProgress } from "@gazgame/engine";
import { useNow } from "@/lib/gaz";
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
  window.addEventListener("storage", listener); // продолжили в другой вкладке
  return () => window.removeEventListener("storage", listener);
}

const EMPTY = JSON.stringify({ tests: {}, games: {} });

export function ContinueCard({ tests, games }: { tests: ContinueTestSummary[]; games: ContinueGame[] }) {
  // Снимок — строка: React не перерисовывает, пока данные не поменялись
  const snapshot = useSyncExternalStore(
    subscribe,
    () => JSON.stringify({ tests: getProgress().listTestProgress(), games: getProgress().listGameStarted() }),
    () => EMPTY,
  );
  // Главная статическая: до гидратации данных всё равно нет
  const now = useNow(0);
  const pick = useMemo(() => {
    const full: ContinueTest[] = tests.map((t) => ({ ...t, questions: t.options.map((n) => ({ options: Array.from({ length: n }) })) }));
    const data = JSON.parse(snapshot) as { tests: Record<string, TestProgress>; games: Record<string, { at: string }> };
    return pickContinue(full, data.tests, games, data.games, now);
  }, [tests, games, snapshot, now]);

  if (!pick) return null;
  const item = pick.kind === "test" ? pick.test : pick.game;
  const href = pick.kind === "test" ? `/test/${item.slug}` : `/game/${item.slug}`;
  return (
    <TrackedLink
      href={href}
      track={{ kind: "home", target: "continue" }}
      className="gaz-press flex min-h-14 w-full items-center gap-3 rounded-[18px] border border-line bg-surface px-3.5 py-2.5 text-left"
    >
      <span aria-hidden="true" className="text-2xl leading-none">
        {item.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <b className="block font-display text-[13.5px] leading-tight font-semibold">Продолжить: {item.title}</b>
        <small className="block text-xs text-muted tabular-nums">{pick.kind === "test" ? `Вопрос ${pick.question} из ${pick.total}` : "Игра не закончена"}</small>
        {pick.kind === "test" && (
          <span aria-hidden="true" className="mt-1.5 block h-1 overflow-hidden rounded bg-line">
            <i className="block h-full rounded bg-[#B58CFF]" style={{ width: `${Math.round((pick.question / pick.total) * 100)}%` }} />
          </span>
        )}
      </span>
      <span className="font-display text-xs font-extrabold whitespace-nowrap text-[#B58CFF]">Дальше →</span>
    </TrackedLink>
  );
}
