// Механика "deck": тянем карточки по одной («Я никогда не…», «Правда или действие»).
// Если у игры есть cardTypes — для каждого типа своя очередь (игрок выбирает Правду или Действие).
import type { Card, Deck } from "@gazgame/content";
import { range, shuffle, type RandomFn } from "../random";

/** Ключ очереди для колоды без типов. */
export const ANY_TYPE = "*";

export interface DeckState {
  /** Перемешанные индексы оставшихся карточек по типам. */
  queues: Record<string, number[]>;
  /** Индекс текущей открытой карточки или null. */
  current: number | null;
  drawn: number;
  total: number;
}

export type DeckAction = { type: "draw"; cardType?: string } | { type: "reset"; state: DeckState };

export function createDeckState(
  deck: Deck,
  { random, typed = false }: { random?: RandomFn; typed?: boolean } = {},
): DeckState {
  const queues: Record<string, number[]> = {};
  if (typed) {
    for (const index of range(deck.cards.length)) {
      const key = deck.cards[index]?.type ?? ANY_TYPE;
      (queues[key] ??= []).push(index);
    }
    for (const key of Object.keys(queues)) queues[key] = shuffle(queues[key] ?? [], random);
  } else {
    queues[ANY_TYPE] = shuffle(range(deck.cards.length), random);
  }
  return { queues, current: null, drawn: 0, total: deck.cards.length };
}

export function remaining(state: DeckState, cardType: string = ANY_TYPE): number {
  return state.queues[cardType]?.length ?? 0;
}

export function isExhausted(state: DeckState): boolean {
  return Object.values(state.queues).every((q) => q.length === 0);
}

export function drawCard(state: DeckState, cardType: string = ANY_TYPE): DeckState {
  const [next, ...rest] = state.queues[cardType] ?? [];
  if (next === undefined) return { ...state, current: null };
  return { ...state, queues: { ...state.queues, [cardType]: rest }, current: next, drawn: state.drawn + 1 };
}

export function currentCard(state: DeckState, deck: Deck): Card | null {
  return state.current === null ? null : (deck.cards[state.current] ?? null);
}

export function deckReducer(state: DeckState, action: DeckAction): DeckState {
  switch (action.type) {
    case "draw":
      return drawCard(state, action.cardType);
    case "reset":
      return action.state;
  }
}
