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
  kind: "test" | "game" | "gaz";
  /** Где нажали: результат теста, закрытая колода, конец игры, платный тест под замком, «Сравниться с партнёром» (совместимость), набор в разделе GAZ */
  source: "result" | "locked-deck" | "game-over" | "locked-test" | "compat" | "gaz-pack";
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

/** Какую карточку выбрали, когда поделились итогом: share_swag (Swag 😎) или share_facts (Facts 📋). id — id теста. */
export function trackShareKind(event: { id: string; kind: "swag" | "facts" }) {
  send(event.kind === "swag" ? "share_swag" : "share_facts", { id: event.id });
}

/** Заход по ссылке из шеринга (?from=share). */
export function trackShareOpen(event: { id: string }) {
  send("share_open", { ...event });
}

/** Нажатие «Кинуть ответку 🔁» — ответ другу, который прислал тест. */
export function trackAnswerBack(event: { id: string }) {
  send("answer_back", { ...event });
}

/** Тап по карточке «скоро» в разделе — считаем, чего ждут больше. id — «раздел:название». */
export function trackSoonClick(event: { id: string }) {
  send("soon_click", { ...event });
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

// ---------- GAZ 🚀 ----------

/** Откуда карта: «Мне скучно», рулетка, вызов друга, «Задание дня». */
type GazSourceProp = "bored" | "roulette" | "dare" | "daily";

/** Тап «Мне скучно 😩». id — id показанного задания (b01…b30). */
export function trackGazBored(event: { id: string }) {
  send("gaz_bored", { ...event });
}

/** Прокрутка Газ-рулетки: какое сочетание выбрали (кто / время / где). */
export function trackGazSpin(event: { who: string; time: string; where: string }) {
  send("gaz_spin", { ...event });
}

/** «Беру! 🔥» (или «Принимаю 🔥» у вызова): задание стало «в процессе». id — id задания. */
export function trackGazTake(event: { id: string; source: GazSourceProp }) {
  send("gaz_take", { ...event });
}

/** «Сделано 🔥» / «Сделано с усложнением 🌶️». gold — с усложнением (золотая карта). */
export function trackGazDone(event: { id: string; source: GazSourceProp; gold: boolean }) {
  send("gaz_done", { ...event });
}

/** «Слабо другу? 🫵»: задание отправляют другу ссылкой. id — id задания. */
export function trackGazDare(event: { id: string }) {
  send("gaz_dare", { ...event });
}

/** «Принимаю 🔥» на экране «Вызов 🫵» — друг открыл ссылку и принял. id — id задания. */
export function trackGazDareAccept(event: { id: string }) {
  send("gaz_dare_accept", { ...event });
}

/** «Отметить день N ✓» в челлендже недели. id — id челленджа, day — день недели (1–7). */
export function trackGazChallengeMark(event: { id: string; day: number }) {
  send("gaz_challenge_mark", { ...event });
}

/** Тап по набору 💎 (в MVP «Скоро»): считаем интерес. id — id набора. Заодно идёт как «Глубже 💎» (deeper_click). */
export function trackGazPackClick(event: { id: string }) {
  send("gaz_pack_click", { ...event });
}
