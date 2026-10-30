// Имя в профиле (необязательное): хранится на устройстве через ProgressStore, нигде не отправляется.
// Первая буква имени показывается на кожаном жетоне «Профиль» главного стола; пока имени нет — «Я».
import { useSyncExternalStore } from "react";
import { getProgress } from "./progress";

const listeners = new Set<() => void>();

export function setProfileName(name: string): void {
  getProgress().saveProfileName(name);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** Сохранённое имя ("" — не задано). До гидратации пусто. */
export function useProfileName(): string {
  return useSyncExternalStore(subscribe, () => getProgress().getProfileName(), () => "");
}

/** Первая буква имени заглавной; без имени — «Я». */
export function profileInitial(name: string): string {
  const first = Array.from(name.trim())[0];
  return first ? first.toUpperCase() : "Я";
}
