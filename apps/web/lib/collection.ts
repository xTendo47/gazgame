"use client";

// «Коллекция 🃏» на устройстве. Карты собираются из того, что уже хранится (итоги тестов, задания GAZ, награды серии,
// челленджи недели); отдельно хранится только «что новое» (ProgressStore.getCollection). Хуки и «появилась новая карта».
import { useMemo, useSyncExternalStore } from "react";
import { addNewCard, type CollectionCard, type CollectionData, type ProgressData } from "@gazgame/engine";
import { getProgress } from "./progress";

const EVENT = "gazgame:collection";
/** Экран пересобирается и при изменениях GAZ и «Сегодня»: у них свои события. */
const EVENTS = [EVENT, "gazgame:gaz", "gazgame:today"];

function subscribe(listener: () => void) {
  for (const e of EVENTS) window.addEventListener(e, listener);
  window.addEventListener("storage", listener); // изменили в другой вкладке
  return () => {
    for (const e of EVENTS) window.removeEventListener(e, listener);
    window.removeEventListener("storage", listener);
  };
}

/** Весь прогресс (итоги тестов, GAZ, «Сегодня», «что новое»). На сервере и до гидратации — null. */
export function useProgressData(): ProgressData | null {
  const snapshot = useSyncExternalStore(subscribe, () => JSON.stringify(getProgress().load()), () => null);
  return useMemo(() => (snapshot ? (JSON.parse(snapshot) as ProgressData) : null), [snapshot]);
}

/** Очередь вспышек и «новые» карты. */
export function useCollectionData(): CollectionData {
  const data = useProgressData();
  return useMemo(() => data?.collection ?? { newKeys: [], flash: [] }, [data]);
}

/** Есть ли новая карта, которую ещё не открыли (оранжевая точка на плитке главной). */
export function useHasNewCard(): boolean {
  return useSyncExternalStore(subscribe, () => getProgress().getCollection().newKeys.length > 0, () => false);
}

/** Изменить данные Коллекции и сказать об этом всем экранам. */
export function updateCollection(update: (data: CollectionData) => CollectionData) {
  getProgress().updateCollection(update);
  window.dispatchEvent(new Event(EVENT));
}

/** Появилась новая карта (итог теста, задание, награда): точка на плитке и вспышка «Новая карта в Коллекции 🃏». */
export function announceCard(card: CollectionCard | null) {
  if (card) updateCollection((d) => addNewCard(d, card));
}
