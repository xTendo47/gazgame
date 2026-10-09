// Механика "guess-partner": «Насколько хорошо вы знаете друг друга».
// Игрок 1 отвечает на каждый вопрос про себя и угадывает ответ партнёра,
// потом передаёт телефон игроку 2, который делает то же самое.
// В конце — процент совпадения и звание (ranks из файла игры).
import type { Deck, GuessPartnerGame } from "@gazgame/content";
import { range } from "../random";

export type GuessStep = "self" | "guess";
export type Rank = GuessPartnerGame["ranks"][number];

export interface PlayerAnswers {
  /** Ответ про себя: индекс варианта по каждому вопросу. */
  self: (number | null)[];
  /** Догадка об ответе партнёра. */
  guess: (number | null)[];
}

export interface GuessPartnerState {
  players: [string, string];
  /** Индексы карточек колоды по порядку. */
  questions: number[];
  answers: [PlayerAnswers, PlayerAnswers];
  player: 0 | 1;
  question: number;
  step: GuessStep;
  /** handoff — пауза «передай телефон партнёру». */
  phase: "answering" | "handoff" | "finished";
}

export type GuessPartnerAction = { type: "answer"; option: number } | { type: "continue" };

export function createGuessPartnerState(
  players: readonly [string, string],
  deck: Deck,
  { limit }: { limit?: number } = {},
): GuessPartnerState {
  const names: [string, string] = [players[0].trim(), players[1].trim()];
  if (!names[0] || !names[1]) throw new Error("Нужны имена обоих игроков");
  const questions = range(deck.cards.length).slice(0, limit ?? deck.cards.length);
  const empty = (): PlayerAnswers => ({ self: questions.map(() => null), guess: questions.map(() => null) });
  return {
    players: names,
    questions,
    answers: [empty(), empty()],
    player: 0,
    question: 0,
    step: "self",
    phase: "answering",
  };
}

export function answerQuestion(state: GuessPartnerState, option: number): GuessPartnerState {
  if (state.phase !== "answering") return state;

  const mine = state.answers[state.player];
  const updated: PlayerAnswers = {
    ...mine,
    [state.step]: mine[state.step].map((v, q) => (q === state.question ? option : v)),
  };
  const answers: [PlayerAnswers, PlayerAnswers] =
    state.player === 0 ? [updated, state.answers[1]] : [state.answers[0], updated];

  if (state.step === "self") return { ...state, answers, step: "guess" };

  const nextQuestion = state.question + 1;
  if (nextQuestion < state.questions.length) return { ...state, answers, question: nextQuestion, step: "self" };
  if (state.player === 0) return { ...state, answers, player: 1, question: 0, step: "self", phase: "handoff" };
  return { ...state, answers, phase: "finished" };
}

export function continueAfterHandoff(state: GuessPartnerState): GuessPartnerState {
  return state.phase === "handoff" ? { ...state, phase: "answering" } : state;
}

export interface QuestionComparison {
  card: number;
  self: [number | null, number | null];
  /** guess[0] — как игрок 1 угадывал игрока 2, и наоборот. */
  guess: [number | null, number | null];
  correct: [boolean, boolean];
}

export interface GuessPartnerScore {
  matches: number;
  total: number;
  percent: number;
  /** Сколько раз каждый угадал партнёра. */
  correctByPlayer: [number, number];
  questions: QuestionComparison[];
}

export function scoreGuessPartner(state: GuessPartnerState): GuessPartnerScore {
  const [a, b] = state.answers;
  const questions = state.questions.map((card, q): QuestionComparison => {
    const self: [number | null, number | null] = [a.self[q] ?? null, b.self[q] ?? null];
    const guess: [number | null, number | null] = [a.guess[q] ?? null, b.guess[q] ?? null];
    return {
      card,
      self,
      guess,
      correct: [guess[0] !== null && guess[0] === self[1], guess[1] !== null && guess[1] === self[0]],
    };
  });
  const correctByPlayer: [number, number] = [
    questions.filter((q) => q.correct[0]).length,
    questions.filter((q) => q.correct[1]).length,
  ];
  const matches = correctByPlayer[0] + correctByPlayer[1];
  const total = questions.length * 2;
  return { matches, total, percent: total === 0 ? 0 : Math.round((matches / total) * 100), correctByPlayer, questions };
}

/** Звание по проценту: самое высокое, до которого дотянули. */
export function rankFor(percent: number, ranks: readonly Rank[]): Rank {
  const sorted = [...ranks].sort((x, y) => y.minPercent - x.minPercent);
  const rank = sorted.find((r) => percent >= r.minPercent) ?? sorted[sorted.length - 1];
  if (!rank) throw new Error("У игры нет званий (ranks)");
  return rank;
}

export function guessPartnerReducer(state: GuessPartnerState, action: GuessPartnerAction): GuessPartnerState {
  switch (action.type) {
    case "answer":
      return answerQuestion(state, action.option);
    case "continue":
      return continueAfterHandoff(state);
  }
}
