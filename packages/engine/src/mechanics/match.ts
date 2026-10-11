// Механика "match" («Совпадём?», это или то): оба игрока по очереди тайно отвечают на одни и те же вопросы
// в одном порядке. Первый → «передай телефон» → второй → процент совпадения и где разошлись.
// Совпадение считается по варианту (0 или 1), а не по половине экрана: половины перемешаны один раз на вопрос.
import type { MatchGame } from "@gazgame/content";
import { pickRound } from "./deck-rounds";
import type { RandomFn } from "../random";

export type MatchPhase = "turn" | "question" | "pass" | "result";

export interface MatchState {
  players: [string, string];
  /** Номера карточек колоды по порядку — одни и те же для обоих. */
  questions: number[];
  /** true — варианты на экране поменяны местами (второй вариант на верхней, оранжевой половине). */
  swapped: boolean[];
  /** Ответы игроков: номер варианта (0 или 1) по каждому вопросу. */
  answers: [number[], number[]];
  /** Кто отвечает сейчас: 0 или 1. */
  turn: 0 | 1;
  /** Номер вопроса у того, кто отвечает. */
  index: number;
  phase: MatchPhase;
}

export type MatchAction =
  /** «Поехали» на экране хода. */
  | { type: "start" }
  /** Ответ: номер варианта (не половины). */
  | { type: "answer"; option: number }
  /** «Телефон у меня 👌»: второй игрок начинает с первого вопроса. */
  | { type: "pass" };

/**
 * Вопросы на игру без повторов внутри уровня, пока не пройдена вся колода (сыгранные — с устройства),
 * потом колода перемешивается заново. Это то же, что раунд у «Кто из нас?».
 */
export function pickMatchQuestions(
  cardCount: number,
  perGame: number,
  used: readonly number[],
  random: RandomFn = Math.random,
): { questions: number[]; used: number[] } {
  const round = pickRound(cardCount, perGame, used, random);
  return { questions: round.cards, used: round.used };
}

export function createMatchState(players: [string, string], questions: number[], random: RandomFn = Math.random): MatchState {
  return {
    players,
    questions,
    swapped: questions.map(() => random() < 0.5),
    answers: [[], []],
    turn: 0,
    index: 0,
    phase: "turn",
  };
}

export function matchReducer(state: MatchState, action: MatchAction): MatchState {
  switch (action.type) {
    case "start":
      return state.phase === "turn" ? { ...state, phase: "question" } : state;
    case "answer": {
      if (state.phase !== "question" || (action.option !== 0 && action.option !== 1)) return state;
      const mine = [...state.answers[state.turn], action.option];
      const answers: [number[], number[]] = state.turn === 0 ? [mine, state.answers[1]] : [state.answers[0], mine];
      const done = state.index + 1 >= state.questions.length;
      if (!done) return { ...state, answers, index: state.index + 1 };
      return { ...state, answers, phase: state.turn === 0 ? "pass" : "result" };
    }
    case "pass":
      return state.phase === "pass" ? { ...state, turn: 1, index: 0, phase: "question" } : state;
  }
}

/** Какой вариант на какой половине: [верхняя (оранжевая), нижняя (салатовая)]. */
export function matchHalves(state: MatchState, index = state.index): [number, number] {
  return state.swapped[index] ? [1, 0] : [0, 1];
}

export interface MatchLine {
  /** Номер карточки в колоде. */
  card: number;
  /** Вариант первого и второго игрока. */
  a: number;
  b: number;
}

export interface MatchScore {
  matched: MatchLine[];
  diverged: MatchLine[];
  /** Совпавшие / все вопросы, в процентах (целое). */
  percent: number;
}

export function scoreMatch(state: MatchState): MatchScore {
  const lines = state.questions.map((card, i) => ({ card, a: state.answers[0][i] ?? -1, b: state.answers[1][i] ?? -1 }));
  const matched = lines.filter((l) => l.a === l.b && l.a >= 0);
  const diverged = lines.filter((l) => l.a !== l.b);
  const percent = state.questions.length ? Math.round((matched.length / state.questions.length) * 100) : 0;
  return { matched, diverged, percent };
}

/** Следующий уровень после колоды deckId (или undefined, если это последний). */
export function nextMatchDeck(game: MatchGame, deckId: string) {
  const i = game.decks.findIndex((d) => d.id === deckId);
  return i >= 0 ? game.decks[i + 1] : undefined;
}
