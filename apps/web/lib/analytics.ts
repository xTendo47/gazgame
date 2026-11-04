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
  kind: "test" | "game" | "gaz" | "collection";
  /** Где нажали: результат теста, закрытая колода, конец игры, платный тест под замком, «Сравниться с партнёром» (совместимость), набор в разделе GAZ */
  source: "result" | "locked-deck" | "game-over" | "locked-test" | "compat" | "gaz-pack" | "collection-puzzle";
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

/** «Слабо другу? 👆»: задание отправляют другу ссылкой. id — id задания. */
export function trackGazDare(event: { id: string }) {
  send("gaz_dare", { ...event });
}

/** «Принимаю 🔥» на экране «Вызов 👆» — друг открыл ссылку и принял. id — id задания. */
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

// ---------- Сегодня 🔥 ----------

/** Открыли экран «Сегодня» (раз за заход). */
export function trackTodayOpen() {
  send("today_open");
}

/** Голос в батле дня. id — id батла (bt01…), choice — левая (a) или правая (b) половина. */
export function trackTodayBattleVote(event: { id: string; choice: "a" | "b" }) {
  send("today_battle_vote", { ...event });
}

/** «Спросить друзей 👆» после голоса в батле: поделились карточкой. id — id батла. */
export function trackTodayBattleShare(event: { id: string }) {
  send("today_battle_share", { ...event });
}

/** Сохранили ответ в дневник «Вопрос дня 💭». Только id вопроса: сам ответ никуда не уходит. */
export function trackTodayQuestionAnswer(event: { id: string }) {
  send("today_question_answer", { ...event });
}

/** «Сделано 🔥» у задания дня ⚡. id — id задания из колоды «Мне скучно». */
export function trackTodayTaskDone(event: { id: string }) {
  send("today_task_done", { ...event });
}

/** Получили награду за серию (карту и/или заморозку). days — ступенька лесенки: 3, 7… */
export function trackTodayStreakReward(event: { days: number }) {
  send("today_streak_reward", { ...event });
}

// ---------- Коллекция 🃏 ----------

/** Открыли экран «Коллекция» (раз за заход). */
export function trackCollectionOpen() {
  send("collection_open");
}

/** Открыли карту на весь экран. key — ключ карты: test:<id теста>, gaz:<id задания>, award:<id награды>. */
export function trackCollectionCardOpen(event: { key: string }) {
  send("collection_card_open", { ...event });
}

/** «В сторис» под открытой картой. key — ключ карты. */
export function trackCollectionCardShare(event: { key: string }) {
  send("collection_card_share", { ...event });
}

/** Тап по плитке «Пазл личности 💎» (в MVP «Скоро в Premium»): замер интереса. Заодно идёт как «Глубже 💎» (deeper_click). */
export function trackCollectionPuzzleClick() {
  send("collection_puzzle_click");
}

// ---------- Объясни 🪧 ----------

/** Старт игры «Объясни» («Погнали 🔥»): режим (words/gestures), уровень, число команд, секунд на ход, цель (0 — без лимита), штраф. Имена команд не отправляем. */
export function trackExplainStart(event: { mode: string; level: string; teams: number; time: number; goal: number; penalty: boolean }) {
  send("explain_start", { ...event });
}

/** Раунд команды закончен (после исправлений в итоге): уровень, сколько слов угадали и сколько пропустили. */
export function trackExplainRoundEnd(event: { level: string; guessed: number; skipped: number }) {
  send("explain_round_end", { ...event });
}

/** Игра дошла до победы: режим, уровень, число команд и сколько раундов сыграно. */
export function trackExplainFinish(event: { mode: string; level: string; teams: number; rounds: number }) {
  send("explain_finish", { ...event });
}

/** Тап по закрытому уровню «Тяжёлый 💎» (замок): замер интереса к Premium. Заодно идёт как «Глубже 💎» (deeper_click). */
export function trackExplainHardClick() {
  send("explain_hard_click");
}

// ---------- Главная ----------

/** Куда нажали на главной (кроме трёх разделов): полоса «Сегодня», 🎲, 👤 Профиль, «Продолжить», GAZ / «Мне скучно», Premium, мини-ряд. */
export type HomeTarget =
  | "today"
  | "dice"
  | "profile"
  | "continue"
  | "gaz"
  | "premium"
  | "collection"
  | "ultimate"
  | "suggest"
  | "play"
  | "music"
  | "rules"
  | "wallpaper"
  | "skin"
  | "show";

export function trackHomeClick(event: { target: HomeTarget }) {
  send("home_click", { ...event });
}

/** Нажали на большую карточку раздела: party — «Тусовка», love — «Романтика», solo — «Соло». Видно, с кем люди приходят. */
export function trackHomeSection(event: { section: "party" | "love" | "solo" }) {
  send("home_section_click", { ...event });
}

// ---------- Шторки и подсказки ----------

/** Открыли шторку «Как играть за 10 секунд». id — slug игры, cards (карточные игры) или test. */
export function trackRulesOpen(event: { id: string; source: "section" | "help" }) {
  send("rules_open", { ...event });
}

/** «Играть →» в шторке правил. */
export function trackRulesPlay(event: { id: string }) {
  send("rules_play", { ...event });
}

/** Открыли умный 🎲. */
export function trackDiceOpen() {
  send("dice_open");
}

/** «Крутить 🎲» / «Крутить ещё 🎲»: что выбрали (size: solo/duo/few/many, mood: fun/talk/brain). */
export function trackDiceRoll(event: { size: string; mood: string }) {
  send("dice_roll", { ...event });
}

/** «Играть →» на карточке, которую выбрал 🎲. id — slug игры или теста. */
export function trackDicePlay(event: { id: string }) {
  send("dice_play", { ...event });
}

/** Подсказки при первом заходе («Сегодня» и 🎲) показали и закрыли. */
export function trackHintsSeen() {
  send("hints_seen");
}
