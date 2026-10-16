"use client";

// Раздел GAZ 🚀 на устройстве: хук с данными и «сейчас» по минутам.
// Данные лежат в ProgressStore (getProgress().getGaz), а не напрямую в localStorage.
import { useMemo, useSyncExternalStore } from "react";
import { emptyGaz, type GazData } from "@gazgame/engine";
import { getProgress } from "./progress";

const EVENT = "gazgame:gaz";
const EMPTY = JSON.stringify(emptyGaz());

function subscribe(listener: () => void) {
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", listener); // изменили в другой вкладке
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

/** Данные GAZ. На сервере и до гидратации — пустые. Снимок — строка, чтобы React не перерисовывал зря. */
export function useGazData(): GazData {
  const snapshot = useSyncExternalStore(subscribe, () => JSON.stringify(getProgress().getGaz()), () => EMPTY);
  return useMemo(() => JSON.parse(snapshot) as GazData, [snapshot]);
}

/** Изменить данные GAZ и сказать об этом всем экранам. */
export function updateGaz(update: (data: GazData) => GazData) {
  getProgress().updateGaz(update);
  window.dispatchEvent(new Event(EVENT));
}

function subscribeMinute(listener: () => void) {
  const timer = window.setInterval(listener, 30_000);
  return () => window.clearInterval(timer);
}

/**
 * Текущее время с точностью до минуты: экран переживает полночь по МСК (счётчик и «в процессе» обновятся сами).
 * serverMs — время сервера из страницы: при гидратации берём его же, чтобы разметка совпала.
 */
export function useNow(serverMs: number): Date {
  const minutes = useSyncExternalStore(subscribeMinute, () => Math.floor(Date.now() / 60_000), () => Math.floor(serverMs / 60_000));
  return useMemo(() => new Date(minutes * 60_000), [minutes]);
}

/** Телефон или компьютер: на компьютере вместо системного «Поделиться» копируем ссылку. */
export function isDesktop(): boolean {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
