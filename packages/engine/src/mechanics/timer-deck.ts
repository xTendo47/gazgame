// Механика "timer-deck" («5 секунд»): колода + таймер на ответ + очки по игрокам. Один телефон идёт по кругу.
// Ход: «Ход: имя» (карта рубашкой вверх) → «Старт» → карта и таймер → «Засчитано» (+1) или «Не засчитано» → следующая карта.
// «Цепочка»: при «Не засчитано» та же карта уходит следующему игроку, пока не обойдёт всех. Карты берутся как в «Кто из нас?»
// (pickRound): без повторов между раундами, пока колода не кончится. Сам таймер — на экране (отсчёт по меткам времени, как в «Объясни»).
import { pickRound } from "./deck-rounds";
import type { RandomFn } from "../random";

export interface TimerDeckSettings {
  /** Имена игроков по кругу (2–10). */
  players: string[];
  /** Сколько карт на каждого игрока. */
  perPlayer: number;
  deckId: string;
  /** Правило «Цепочка». */
  chain: boolean;
}

export type TimerDeckPhase = "turn" | "card" | "final";

export interface TimerDeckState {
  settings: TimerDeckSettings;
  /** Номера карточек колоды по порядку: игроков × карт на игрока (но не больше, чем карт в колоде). */
  cards: number[];
  /** Номер карты в раунде (0 — первая). */
  index: number;
  /** Кто отвечает сейчас. */
  player: number;
  /** Сколько раз эта карта уже передана дальше по «Цепочке» (0 — карта у своего игрока). */
  hops: number;
  phase: TimerDeckPhase;
  /** Очки игроков. */
  scores: number[];
}

/** Сколько игроков и карт на игрока нужно на раунд. */
export const roundCardCount = (settings: Pick<TimerDeckSettings, "players" | "perPlayer">): number => settings.players.length * settings.perPlayer;

/** Карты нового раунда: без повторов с прошлыми (used — с устройства). */
export function planTimerDeck(
  deckSize: number,
  settings: Pick<TimerDeckSettings, "players" | "perPlayer">,
  used: readonly number[],
  random?: RandomFn,
): { cards: number[]; used: number[] } {
  return pickRound(deckSize, roundCardCount(settings), used, random);
}

/** Имена: пустые заменяются на «Игрок N». */
export function playerNames(names: readonly string[]): string[] {
  return names.map((n, i) => n.trim() || `Игрок ${i + 1}`);
}

export function startTimerDeck(settings: TimerDeckSettings, cards: number[]): TimerDeckState {
  return { settings, cards, index: 0, player: 0, hops: 0, phase: "turn", scores: settings.players.map(() => 0) };
}

/** «Старт ⏱️»: карту переворачиваем, таймер идёт. */
export function beginCard(state: TimerDeckState): TimerDeckState {
  return state.phase === "turn" ? { ...state, phase: "card" } : state;
}

/** Следующая карта следующему игроку по кругу — или финал. */
function advance(state: TimerDeckState): TimerDeckState {
  const index = state.index + 1;
  if (index >= state.cards.length) return { ...state, phase: "final", hops: 0 };
  return { ...state, index, player: index % state.settings.players.length, hops: 0, phase: "turn" };
}

/** «Засчитано» (+1) или «Не засчитано»; при включённой «Цепочке» не засчитанная карта уходит следующему игроку. */
export function answerCard(state: TimerDeckState, ok: boolean): TimerDeckState {
  if (state.phase !== "card") return state;
  const players = state.settings.players.length;
  if (ok) {
    const scores = state.scores.map((s, i) => (i === state.player ? s + 1 : s));
    return advance({ ...state, scores });
  }
  if (state.settings.chain && state.hops + 1 < players) {
    return { ...state, player: (state.player + 1) % players, hops: state.hops + 1, phase: "turn" };
  }
  return advance(state);
}

export interface Standings {
  /** Лучший счёт и те, у кого он есть. */
  winners: number[];
  tie: boolean;
  /** Последнее место — только если очки не у всех поровну. */
  last: number[];
}

/** Первое место, ничья на вершине и последнее место. */
export function standings(scores: readonly number[]): Standings {
  const top = Math.max(...scores);
  const low = Math.min(...scores);
  const at = (value: number) => scores.flatMap((s, i) => (s === value ? [i] : []));
  const winners = at(top);
  return { winners, tie: winners.length > 1, last: low < top ? at(low) : [] };
}

/** Игроки через запятую и «и»: «Аня и Боря», «Аня, Боря и Витя». */
export function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} и ${names[names.length - 1]}`;
}
