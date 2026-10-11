"use client";

// Уровень пользователя (free / premium). Оплаты пока нет — у всех free.
// Только при разработке подписку можно включить для проверки: ?tier=premium в адресе страницы.
// На продакшене параметр не работает.
import { useSyncExternalStore } from "react";
import type { Tier } from "@gazgame/content";
import { DEFAULT_USER_TIER } from "@gazgame/engine";

const noopSubscribe = () => () => {};

function readTier(): Tier {
  if (process.env.NODE_ENV === "production") return DEFAULT_USER_TIER;
  return new URLSearchParams(window.location.search).get("tier") === "premium" ? "premium" : DEFAULT_USER_TIER;
}

export function useUserTier(): Tier {
  return useSyncExternalStore(noopSubscribe, readTier, () => DEFAULT_USER_TIER);
}
