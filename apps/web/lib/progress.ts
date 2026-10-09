// Прогресс пользователя для клиентских компонентов.
// Экраны работают с ProgressStore из движка; где лежат данные — решается только здесь.
// Сейчас — localStorage на устройстве, позже — сервер (apps/api).
import { createProgressStore, type ProgressStore } from "@gazgame/engine";

let store: ProgressStore | undefined;

export function getProgress(): ProgressStore {
  if (!store) {
    let kv: Storage | null = null;
    try {
      kv = typeof window !== "undefined" ? window.localStorage : null;
    } catch {
      kv = null; // доступ к localStorage запрещён (например, приватный режим)
    }
    store = createProgressStore(kv);
  }
  return store;
}
