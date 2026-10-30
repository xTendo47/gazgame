// Оформление коробки на главном столе: 5 скинов, выбор запоминается на устройстве (ProgressStore).
// Меняется лампочкой в углу стола и в шторке «Обои».
import { useSyncExternalStore } from "react";
import { getProgress } from "./progress";

export const BOX_SKINS = [
  { id: "classic", name: "Классика" },
  { id: "sand", name: "Песок" },
  { id: "ice", name: "Лёд" },
  { id: "west", name: "West" },
  { id: "baroque", name: "Барокко" },
] as const;

export type BoxSkinId = (typeof BOX_SKINS)[number]["id"];

const listeners = new Set<() => void>();

function readSkin(): BoxSkinId {
  const saved = getProgress().getBoxSkin();
  return BOX_SKINS.find((s) => s.id === saved)?.id ?? "classic";
}

export function setBoxSkin(id: BoxSkinId): void {
  getProgress().saveBoxSkin(id);
  listeners.forEach((l) => l());
}

/** Следующий по кругу скин — для лампочки. */
export function nextBoxSkin(id: BoxSkinId): BoxSkinId {
  const i = BOX_SKINS.findIndex((s) => s.id === id);
  return BOX_SKINS[(i + 1) % BOX_SKINS.length]?.id ?? "classic";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** Текущий скин. До гидратации — «классика» (сервер не знает выбор). */
export function useBoxSkin(): BoxSkinId {
  return useSyncExternalStore(subscribe, readSkin, () => "classic");
}
