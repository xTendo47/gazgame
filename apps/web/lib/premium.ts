"use client";

// Premium 💎 — одно состояние на всё приложение. Включается кодом фокус-группы и хранится на устройстве
// (ProgressStore). Пока нет оплаты и аккаунтов, это единственный способ снять замки.
// Все экраны спрашивают только usePremium(): колоды, роли Мафии, Совместимость, превью платных тестов.
import { useSyncExternalStore } from "react";
import type { Tier } from "@gazgame/content";
import { checkPremiumCode } from "@gazgame/engine";
import { trackPremiumActivate } from "./analytics";
import { getProgress } from "./progress";

const EVENT = "gazgame:premium";

function subscribe(listener: () => void) {
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", listener); // включили в другой вкладке
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

/** Включён ли Premium. На сервере и до гидратации — false. */
export function usePremium(): boolean {
  return useSyncExternalStore(subscribe, () => getProgress().isPremium(), () => false);
}

/** Уровень доступа для deckAccess: с Premium замок «по подписке» не мешает. */
export function tierFor(premium: boolean): Tier {
  return premium ? "premium" : "free";
}

/** Проверить код и включить Premium. true — код верный. Само событие — без кода, только начало хэша. */
export function activatePremium(code: string, hashes: readonly string[]): boolean {
  const hash = checkPremiumCode(code, hashes);
  if (!hash) return false;
  getProgress().activatePremium(hash);
  trackPremiumActivate({ code: hash.slice(0, 6) });
  window.dispatchEvent(new Event(EVENT));
  return true;
}
