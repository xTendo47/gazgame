"use client";

// $HOW на устройстве: вопрос дня и серия. Данные лежат в ProgressStore (getShow/updateShow), а не напрямую в localStorage.
import { useMemo, useSyncExternalStore } from "react";
import { emptyShow, recordDaily, type ShowData } from "@gazgame/engine";
import { getProgress } from "./progress";

const EVENT = "gazgame:show";
const EMPTY = JSON.stringify(emptyShow());

function subscribe(listener: () => void) {
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", listener); // изменили в другой вкладке
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

/** Данные $HOW. На сервере и до гидратации — пустые. */
export function useShowData(): ShowData {
  const snapshot = useSyncExternalStore(subscribe, () => JSON.stringify(getProgress().getShow()), () => EMPTY);
  return useMemo(() => JSON.parse(snapshot) as ShowData, [snapshot]);
}

/** Записать ответ на вопрос дня и сказать об этом экрану. */
export function saveDailyAnswer(correct: boolean, now = new Date()) {
  getProgress().updateShow((data) => recordDaily(data, correct, now));
  window.dispatchEvent(new Event(EVENT));
}
