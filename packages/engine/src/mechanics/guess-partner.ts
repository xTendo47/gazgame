// Механика "guess-partner": «Насколько ты меня знаешь».
// Раунд 1: первый игрок тайком отвечает про себя → «передай телефон» → второй угадывает его ответы.
// После раунда 1 можно показать результат сразу или сыграть раунд 2 (игроки меняются местами).
// Вопросы и порядок вариантов перемешаны, набор один и тот же в обоих раундах.
// Правильные ответы нигде не показываются — только проценты.
import type { Card, Deck, GuessPartnerGame } from "@gazgame/content";
import { range, shuffle, type RandomFn } from "../random";

export type Rank = GuessPartnerGame["ranks"][number];

export interface GuessQuestion {
  /** Номер карточки в колоде. */
  card: number;
  /** Порядок показа вариантов: order[i] — исходный номер варианта на i-м месте. */
  order: number[];
}

/** Ответы одного раунда. Номера — исходные номера вариантов (как в options), совпадение — по ним. */
export interface RoundAnswers {
  self: (number | null)[];
  guess: (number | null)[];
}

export type GuessPhase =
  /** Тот, про кого раунд, тайком отвечает про себя. */
  | "self"
  /** «Передай телефон 🙈». */
  | "handoff"
  /** Второй угадывает. */
  | "guess"
  /** Раунд 1 сыгран: «Теперь меняемся» или «Показать результат сейчас». */
  | "between"
  | "finished";

export interface GuessPartnerState {
  players: [string, string];
  questions: GuessQuestion[];
  /** 0 — первый отвечает про себя, второй угадывает; 1 — наоборот. */
  round: 0 | 1;
  phase: GuessPhase;
  /** Номер текущего вопроса в раунде. */
  question: number;
  /** Ответы по раундам. Раунд 2 появляется, только если его начали. */
  rounds: RoundAnswers[];
}

export type GuessPartnerAction =
  /** Выбор варианта: номер места на экране (0 — верхняя кнопка). */
  | { type: "answer"; shown: number }
  /** handoff → угадывание; between → раунд 2. */
  | { type: "continue" }
  /** between → сразу результат (сыграли один раунд). */
  | { type: "finish" };

/** Сколько вопросов за игру: questionsPerGame колоды, но не больше, чем карточек. */
export function questionsPerGame(deck: Deck): number {
  return Math.min(deck.questionsPerGame ?? deck.cards.length, deck.cards.length);
}

/**
 * Какие карточки взять в новую игру.
 * Сначала те, которых не было в прошлой игре (в случайном порядке), остальные — случайно из прошлых.
 * Итоговый порядок перемешивается.
 * @param previous номера карточек прошлой игры
 */
export function pickQuestions(cardCount: number, count: number, previous: readonly number[], random: RandomFn = Math.random) {
  const seen = new Set(previous);
  const all = range(cardCount);
  const fresh = shuffle(
    all.filter((i) => !seen.has(i)),
    random,
  );
  const repeat = shuffle(
    all.filter((i) => seen.has(i)),
    random,
  );
  return shuffle([...fresh, ...repeat].slice(0, Math.min(count, cardCount)), random);
}

export function createGuessPartnerState(
  players: readonly [string, string],
  deck: Deck,
  { previous = [], random = Math.random }: { previous?: readonly number[]; random?: RandomFn } = {},
): GuessPartnerState {
  const names: [string, string] = [players[0].trim(), players[1].trim()];
  if (!names[0] || !names[1]) throw new Error("Нужны имена обоих игроков");
  const cards = pickQuestions(deck.cards.length, questionsPerGame(deck), previous, random);
  const questions = cards.map((card) => ({ card, order: shuffle(range(deck.cards[card]?.options?.length ?? 0), random) }));
  return { players: names, questions, round: 0, phase: "self", question: 0, rounds: [emptyRound(questions.length)] };
}

function emptyRound(n: number): RoundAnswers {
  return { self: Array.from({ length: n }, () => null), guess: Array.from({ length: n }, () => null) };
}

/** Кто в этом раунде отвечает про себя (subject) и кто угадывает (guesser). Индексы в players. */
export function roundRoles(round: 0 | 1): { subject: 0 | 1; guesser: 0 | 1 } {
  return round === 0 ? { subject: 0, guesser: 1 } : { subject: 1, guesser: 0 };
}

/** Номера карточек этой игры — чтобы в следующий раз начать с других. */
export function playedCards(state: GuessPartnerState): number[] {
  return state.questions.map((q) => q.card);
}

export function guessPartnerReducer(state: GuessPartnerState, action: GuessPartnerAction): GuessPartnerState {
  switch (action.type) {
    case "answer": {
      if (state.phase !== "self" && state.phase !== "guess") return state;
      const q = state.questions[state.question];
      const option = q?.order[action.shown];
      if (option === undefined) return state;

      const step = state.phase;
      const round = state.rounds[state.round] as RoundAnswers;
      const updated = { ...round, [step]: round[step].map((v, i) => (i === state.question ? option : v)) };
      const rounds = state.rounds.map((r, i) => (i === state.round ? updated : r));

      const next = state.question + 1;
      if (next < state.questions.length) return { ...state, rounds, question: next };
      if (step === "self") return { ...state, rounds, phase: "handoff", question: 0 };
      return { ...state, rounds, phase: state.round === 0 ? "between" : "finished", question: 0 };
    }
    case "continue":
      if (state.phase === "handoff") return { ...state, phase: "guess" };
      if (state.phase === "between") {
        return { ...state, round: 1, phase: "self", question: 0, rounds: [...state.rounds, emptyRound(state.questions.length)] };
      }
      return state;
    case "finish":
      return state.phase === "between" ? { ...state, phase: "finished" } : state;
  }
}

/** Что видит игрок на текущем шаге: вопрос и варианты в перемешанном порядке. */
export function currentView(state: GuessPartnerState, deck: Deck): { text: string; options: string[] } | null {
  if (state.phase !== "self" && state.phase !== "guess") return null;
  const q = state.questions[state.question];
  const card = q && deck.cards[q.card];
  if (!q || !card) return null;
  const subject = state.players[roundRoles(state.round).subject];
  const view = state.phase === "self" ? selfView(card) : guessView(card, subject);
  return { text: view.text, options: q.order.map((i) => view.options[i] ?? "") };
}

/** Вопрос для того, кто отвечает про себя: selfText и selfOptions (если их нет — text и options). */
export function selfView(card: Card): { text: string; options: string[] } {
  return { text: card.selfText ?? card.text, options: card.selfOptions ?? card.options ?? [] };
}

/** Вопрос для угадывающего: {name} в text заменяется на имя того, про кого раунд. */
export function guessView(card: Card, name: string): { text: string; options: string[] } {
  return { text: card.text.replaceAll("{name}", name), options: card.options ?? [] };
}

export interface RoundScore {
  /** Про кого был раунд. */
  subject: 0 | 1;
  /** Кто угадывал. */
  guesser: 0 | 1;
  matches: number;
  total: number;
  percent: number;
}

export interface GuessPartnerScore {
  /** Только сыгранные до конца раунды. */
  rounds: RoundScore[];
  /** Средний процент по сыгранным раундам — по нему выбирается звание. */
  percent: number;
}

export function scoreGuessPartner(state: GuessPartnerState): GuessPartnerScore {
  const rounds = state.rounds
    .map((r, i): RoundScore | null => {
      if (r.guess.some((g) => g === null)) return null; // раунд не доигран
      const matches = r.guess.filter((g, q) => g !== null && g === r.self[q]).length;
      const total = r.guess.length;
      return { ...roundRoles(i as 0 | 1), matches, total, percent: total === 0 ? 0 : Math.round((matches / total) * 100) };
    })
    .filter((r): r is RoundScore => r !== null);
  const percent = rounds.length === 0 ? 0 : Math.round(rounds.reduce((sum, r) => sum + r.percent, 0) / rounds.length);
  return { rounds, percent };
}

/** Звание по проценту: самое высокое, до которого дотянули. */
export function rankFor(percent: number, ranks: readonly Rank[]): Rank {
  const sorted = [...ranks].sort((x, y) => y.minPercent - x.minPercent);
  const rank = sorted.find((r) => percent >= r.minPercent) ?? sorted[sorted.length - 1];
  if (!rank) throw new Error("У игры нет званий (ranks)");
  return rank;
}

/** Следующий уровень после колоды deckId (или undefined, если это последний). */
export function nextDeck(game: GuessPartnerGame, deckId: string): Deck | undefined {
  const i = game.decks.findIndex((d) => d.id === deckId);
  return i >= 0 ? game.decks[i + 1] : undefined;
}
