"use client";

// «Сегодня 🔥» на устройстве: хук с данными и «засчитать день». Данные лежат в ProgressStore (getToday/updateToday).
// Засчитывает день всё, что делает человек: голос в батле, ответ, «Сделано» у задания дня и у любого задания раздела GAZ.
import { useMemo, useSyncExternalStore } from "react";
import type { TodayLadderStep } from "@gazgame/content";
import { countToday, emptyToday, streakCard, type TodayData } from "@gazgame/engine";
import { trackTodayStreakReward } from "./analytics";
import { announceCard } from "./collection";
import { haptic } from "./haptics";
import { getProgress } from "./progress";

const EVENT = "gazgame:today";
const EMPTY = JSON.stringify(emptyToday());

function subscribe(listener: () => void) {
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", listener); // изменили в другой вкладке
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

/** Данные «Сегодня». На сервере и до гидратации — пустые. */
export function useTodayData(): TodayData {
  const snapshot = useSyncExternalStore(subscribe, () => JSON.stringify(getProgress().getToday()), () => EMPTY);
  return useMemo(() => JSON.parse(snapshot) as TodayData, [snapshot]);
}

/** Изменить данные «Сегодня» и сказать об этом всем экранам. */
export function updateToday(update: (data: TodayData) => TodayData) {
  getProgress().updateToday(update);
  window.dispatchEvent(new Event(EVENT));
}

/**
 * Засчитать сегодняшний день. Первый раз за день: вибрация-фанфара, серия +1, награда за ступеньку (если есть).
 * ladder — награды из today.json. Уже засчитан — ничего не делает.
 */
export function countDay(ladder: readonly TodayLadderStep[]) {
  let reward: number | undefined;
  let counted = false;
  updateToday((d) => {
    const r = countToday(d, new Date(), ladder);
    counted = r.counted;
    reward = r.reward;
    return r.data;
  });
  if (counted) haptic("fanfare");
  if (reward !== undefined) {
    trackTodayStreakReward({ days: reward });
    // карта за серию (3 и 7 дней) — «Новая карта в Коллекции 🃏»
    const step = ladder.find((s) => s.days === reward);
    announceCard(step ? streakCard(step) : null);
  }
}
