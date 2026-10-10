// Механика "deck" раундами («Кто из нас?»): у игры задан roundSize.
// Правила → карточка → «передай телефон» → … → финал раунда. «Ещё раунд» — новые карточки.
// Карточки не повторяются между раундами, пока колода не кончится; потом колода перемешивается заново.
import { range, shuffle, type RandomFn } from "../random";

/**
 * Карточки на новый раунд.
 * @param used номера карточек, уже сыгранных в прошлых раундах (с устройства)
 * @returns cards — карточки раунда по порядку; used — что считать сыгранным после этого раунда
 */
export function pickRound(
  cardCount: number,
  roundSize: number,
  used: readonly number[],
  random: RandomFn = Math.random,
): { cards: number[]; used: number[] } {
  const size = Math.min(roundSize, cardCount);
  const usedSet = new Set(used.filter((i) => i >= 0 && i < cardCount));
  const fresh = shuffle(
    range(cardCount).filter((i) => !usedSet.has(i)),
    random,
  );
  if (fresh.length >= size) {
    const cards = fresh.slice(0, size);
    return { cards, used: [...usedSet, ...cards] };
  }
  // Колода кончилась: доигрываем остаток, а недостающие берём из заново перемешанной колоды (без повторов внутри раунда).
  const restart = shuffle(
    range(cardCount).filter((i) => !fresh.includes(i)),
    random,
  ).slice(0, size - fresh.length);
  return { cards: [...fresh, ...restart], used: restart };
}

export type RoundPhase = "rules" | "card" | "handoff" | "finale";

export interface RoundState {
  /** Номера карточек раунда по порядку. */
  cards: number[];
  /** Номер текущей карточки в раунде (0 — первая). */
  index: number;
  phase: RoundPhase;
}

export type RoundAction =
  /** rules → первая карточка. */
  | { type: "start" }
  /** card → handoff (или finale после последней); handoff → следующая карточка. */
  | { type: "next" }
  /** «Ещё раунд»: новые карточки, правила уже не показываем. */
  | { type: "newRound"; cards: number[] };

export function createRoundState(cards: number[], { showRules = true }: { showRules?: boolean } = {}): RoundState {
  return { cards, index: 0, phase: showRules ? "rules" : "card" };
}

export function roundReducer(state: RoundState, action: RoundAction): RoundState {
  switch (action.type) {
    case "start":
      return state.phase === "rules" ? { ...state, phase: "card" } : state;
    case "next":
      if (state.phase === "card") {
        return state.index + 1 < state.cards.length ? { ...state, phase: "handoff" } : { ...state, phase: "finale" };
      }
      if (state.phase === "handoff") return { ...state, phase: "card", index: state.index + 1 };
      return state;
    case "newRound":
      return createRoundState(action.cards, { showRules: false });
  }
}

/** Случайная подсказка, по возможности не та же, что была только что. */
export function pickHint(hints: readonly string[], previous: string | null, random: RandomFn = Math.random): string | null {
  const pool = hints.length > 1 ? hints.filter((h) => h !== previous) : hints;
  return pool[Math.floor(random() * pool.length)] ?? null;
}
