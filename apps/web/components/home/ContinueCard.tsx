"use client";

// «Продолжить» на главной: последний незаконченный тест («Вопрос 7 из 12») или игра, которую открыли и не доиграли
// (ход игры не сохраняется, «Дальше» начинает заново). Нет незаконченного — null. Билет на столе рисует StartTable.
// Всё на устройстве (ProgressStore: testProgress и gameStarted).
import { useMemo, useSyncExternalStore } from "react";
import { pickContinue, type ContinueGame, type ContinueTest, type TestProgress } from "@gazgame/engine";
import { useNow } from "@/lib/gaz";
import { getProgress } from "@/lib/progress";

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

/** Что продолжить: тест, игра или ничего. */
export function useContinuePick(tests: ContinueTestSummary[], games: ContinueGame[]) {
  // Снимок — строка: React не перерисовывает, пока данные не поменялись
  const snapshot = useSyncExternalStore(
    subscribe,
    () => JSON.stringify({ tests: getProgress().listTestProgress(), games: getProgress().listGameStarted() }),
    () => EMPTY,
  );
  // Главная статическая: до гидратации данных всё равно нет
  const now = useNow(0);
  return useMemo(() => {
    const full: ContinueTest[] = tests.map((t) => ({ ...t, questions: t.options.map((n) => ({ options: Array.from({ length: n }) })) }));
    const data = JSON.parse(snapshot) as { tests: Record<string, TestProgress>; games: Record<string, { at: string }> };
    return pickContinue(full, data.tests, games, data.games, now);
  }, [tests, games, snapshot, now]);
}
