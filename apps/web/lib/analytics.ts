// События аналитики (Vercel Analytics, custom events).
// Все события описаны здесь — так видно, что мы собираем. Никаких личных данных.
import { track } from "@vercel/analytics";

export interface DeeperClickEvent {
  /** id теста или игры */
  id: string;
  kind: "test" | "game";
  /** Где нажали: результат теста, закрытая колода, конец игры */
  source: "result" | "locked-deck" | "game-over";
}

/** Нажатие «Глубже 💎» — наш замер спроса на подписку. */
export function trackDeeperClick(event: DeeperClickEvent) {
  if (process.env.NODE_ENV !== "production") return; // при разработке ничего не отправляем
  try {
    track("deeper_click", { ...event });
  } catch {
    // аналитика не должна ломать приложение
  }
}
