// События аналитики (Vercel Analytics, custom events).
// Все события описаны здесь — так видно, что мы собираем. Никаких личных данных.
// При разработке ничего не отправляем: события только складываются в window.__gazgameEvents (видно в консоли).
import { track } from "@vercel/analytics";
import { getProgress } from "./progress";

type EventProps = Record<string, string | number | boolean>;

function send(name: string, props: EventProps = {}) {
  try {
    if (process.env.NODE_ENV !== "production") {
      const w = window as unknown as { __gazgameEvents?: { name: string; props: EventProps }[] };
      (w.__gazgameEvents ??= []).push({ name, props });
      return;
    }
    track(name, props);
  } catch {
    // аналитика не должна ломать приложение
  }
}

export interface DeeperClickEvent {
  /** id теста или игры */
  id: string;
  kind: "test" | "game";
  /** Где нажали: результат теста, закрытая колода, конец игры, платный тест под замком, «Сравниться с партнёром» (совместимость) */
  source: "result" | "locked-deck" | "game-over" | "locked-test" | "compat";
}

/** Нажатие «Глубже 💎» — наш замер спроса на подписку. С включённым Premium не шлём: замков для него нет. */
export function trackDeeperClick(event: DeeperClickEvent) {
  if (getProgress().isPremium()) return;
  send("deeper_click", { ...event });
}

/** Куда поделились итогом: сторис, Telegram, системное меню/текст другу, ссылка, сохранение картинки. */
export type ShareChannel = "story" | "telegram" | "other" | "copy" | "save";

export interface ShareClickEvent {
  /** id теста */
  id: string;
  channel: ShareChannel;
}

/** Нажатие в меню «Куда кидаем?». */
export function trackShareClick(event: ShareClickEvent) {
  send("share_click", { ...event });
}

/** Заход по ссылке из шеринга (?from=share). */
export function trackShareOpen(event: { id: string }) {
  send("share_open", { ...event });
}

/** Нажатие «Кинуть ответку 🔁» — ответ другу, который прислал тест. */
export function trackAnswerBack(event: { id: string }) {
  send("answer_back", { ...event });
}

// ---------- Premium 💎 ----------

/** Нажатие «Оформить Premium 💎» на экране /premium — спрос на подписку. */
export function trackSubscribeClick() {
  send("subscribe_click");
}

/** «Хочу первым 🔔» в шторке оплаты — лист ожидания. Шлём один раз на устройство. */
export function trackSubscribeWaitlist() {
  send("subscribe_waitlist");
}

/** Premium включён кодом. code — первые 6 символов SHA-256 кода (сам код не отправляем): видно, чей код сработал. */
export function trackPremiumActivate(event: { code: string }) {
  send("premium_activate", { ...event });
}

/** Открыли превью платного теста (шторка). id — id теста. */
export function trackPreviewOpen(event: { id: string }) {
  send("preview_open", { ...event });
}

/** «Открыть с Premium 💎» в превью платного теста. id — id теста. */
export function trackPreviewUnlockClick(event: { id: string }) {
  send("preview_unlock_click", { ...event });
}

// ---------- Ultimate 🔱 ----------

/** «Хочу первым 🔔» на экране Ultimate — лист ожидания будущего приложения. Шлём один раз на устройство. */
export function trackUltimateWaitlist() {
  send("ultimate_waitlist");
}
