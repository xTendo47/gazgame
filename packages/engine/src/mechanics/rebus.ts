// Механика "rebus" («Угадай по эмодзи»): ребус из эмодзи, ответ выкрикивает компания и сама решает, угадали ли.
// Без команд: раунд из roundSize карточек, в конце «угадали N из M». С командами (две): ход переходит после каждой карточки,
// без подсказки +2 очка, с подсказкой +1, пас 0; игра до цели, победа — после полного круга (ничья — ещё круг), как в «Объясни».
// Карточки берутся как в «Кто из нас?» (pickRound): без повторов, пока колода не кончится. Таймер — на экране.
import type { Card, Deck } from "@gazgame/content";
import { pickRound } from "./deck-rounds";
import type { RandomFn } from "../random";

export const REBUS_POINTS_NO_HINT = 2;
export const REBUS_POINTS_WITH_HINT = 1;

export interface RebusSettings {
  deckId: string;
  /** Режим «Команды». */
  teams: boolean;
  teamNames: [string, string];
  /** Игра командами до стольких очков. */
  goal: number;
  /** Таймер на карточку (на нуле ответ открывается сам). */
  timer: boolean;
}

export type RebusPhase = "card" | "final" | "win";

export interface RebusState {
  settings: RebusSettings;
  /** Номера карточек колоды по порядку. */
  cards: number[];
  index: number;
  phase: RebusPhase;
  /** На этой карточке уже нажали «Подсказка 💡». */
  hint: boolean;
  /** На этой карточке уже открыт ответ. */
  revealed: boolean;
  /** Без команд: сколько угадали и сколько пропустили. */
  guessed: number;
  passed: number;
  /** С командами: очки, чей ход (0 или 1) и сколько карточек сыграно. */
  scores: [number, number];
  team: 0 | 1;
  turns: number;
  /** Победившая команда (фаза win); null — ничья, когда карточки кончились. */
  winner: 0 | 1 | null;
}

/** Карточки игры: без команд — один раунд, с командами — вся колода (играют до цели). Без повторов с прошлыми играми (used с устройства). */
export function planRebus(deckSize: number, roundSize: number, teams: boolean, used: readonly number[], random?: RandomFn): { cards: number[]; used: number[] } {
  return pickRound(deckSize, teams ? deckSize : roundSize, used, random);
}

export function startRebus(settings: RebusSettings, cards: number[]): RebusState {
  return { settings, cards, index: 0, phase: "card", hint: false, revealed: false, guessed: 0, passed: 0, scores: [0, 0], team: 0, turns: 0, winner: null };
}

export function askRebusHint(state: RebusState): RebusState {
  return state.phase === "card" ? { ...state, hint: true } : state;
}

export function revealRebusAnswer(state: RebusState): RebusState {
  return state.phase === "card" ? { ...state, revealed: true } : state;
}

/** Первая буква ответа для подсказки: «ВАЛЛ-И» → «В», «101 далматинец» → «1». */
export function firstLetter(answer: string): string {
  const ch = [...answer].find((c) => /[\p{L}\p{N}]/u.test(c)) ?? answer.charAt(0);
  return ch.toUpperCase();
}

/** Что показывает «Подсказка 💡»: название колоды, первая буква ответа и намёк из карточки. */
export function hintParts(deck: Pick<Deck, "title">, card: Pick<Card, "answer" | "hint">): { theme: string; letter: string; hint: string | undefined } {
  return { theme: deck.title, letter: firstLetter(card.answer ?? ""), hint: card.hint };
}

/** Очки за угаданную карточку: без подсказки +2, с подсказкой +1. */
export const rebusPoints = (usedHint: boolean): number => (usedHint ? REBUS_POINTS_WITH_HINT : REBUS_POINTS_NO_HINT);

/** «Угадали ✅» или «Пас» — карточка закончилась, идём дальше. */
export function resolveRebus(state: RebusState, guessed: boolean): RebusState {
  if (state.phase !== "card") return state;
  const next = { ...state, index: state.index + 1, hint: false, revealed: false };
  const exhausted = next.index >= state.cards.length;

  if (!state.settings.teams) {
    const counted = { ...next, guessed: state.guessed + (guessed ? 1 : 0), passed: state.passed + (guessed ? 0 : 1) };
    return exhausted ? { ...counted, phase: "final" } : counted;
  }

  const scores: [number, number] = [state.scores[0], state.scores[1]];
  if (guessed) scores[state.team] += rebusPoints(state.hint);
  const turns = state.turns + 1;
  const moved: RebusState = { ...next, scores, team: state.team === 0 ? 1 : 0, turns };
  // победа — только после полного круга (обе команды сыграли поровну); ничья на цели — ещё круг
  const circleDone = turns % 2 === 0;
  const best = Math.max(scores[0], scores[1]);
  if (circleDone && best >= state.settings.goal && scores[0] !== scores[1]) {
    return { ...moved, phase: "win", winner: scores[0] > scores[1] ? 0 : 1 };
  }
  if (exhausted) return { ...moved, phase: "win", winner: scores[0] === scores[1] ? null : scores[0] > scores[1] ? 0 : 1 };
  return moved;
}
