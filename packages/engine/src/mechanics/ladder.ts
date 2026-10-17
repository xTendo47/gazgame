// Механика "ladder" («36 вопросов»): уровни идут по порядку, внутри уровня порядок карточек фиксирован.
// Здесь — чистые правила: кто начинает, номер вопроса в игре и таймер (4 минуты на историю и «глаза в глаза»).
import type { LadderGame } from "@gazgame/content";

/** Номер вопроса в игре с нуля: сколько карточек в уровнях до этого + номер в уровне. */
export function ladderNumber(game: LadderGame, deckIndex: number, cardIndex: number): number {
  return game.decks.slice(0, deckIndex).reduce((sum, d) => sum + d.cards.length, 0) + cardIndex;
}

/** Кто начинает вопрос: 0 — «Игрок 1», 1 — «Игрок 2». Чередуется по номеру вопроса в игре (1-й — Игрок 1, 2-й — Игрок 2…). */
export function ladderStarter(game: LadderGame, deckIndex: number, cardIndex: number): 0 | 1 {
  return (ladderNumber(game, deckIndex, cardIndex) % 2) as 0 | 1;
}

/** Следующий уровень после этого; undefined — это последний. */
export function nextLadderDeck(game: LadderGame, deckIndex: number) {
  return game.decks[deckIndex + 1];
}

// ---------- Таймер ----------

export interface TimerState {
  /** Сколько секунд осталось. */
  remaining: number;
  running: boolean;
}

export type TimerAction = { type: "toggle" } | { type: "tick" } | { type: "reset"; seconds: number };

export function createTimer(seconds: number): TimerState {
  return { remaining: seconds, running: false };
}

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case "toggle":
      return state.remaining > 0 ? { ...state, running: !state.running } : state;
    case "tick": {
      if (!state.running) return state;
      const remaining = Math.max(0, state.remaining - 1);
      return { remaining, running: remaining > 0 };
    }
    case "reset":
      return createTimer(action.seconds);
  }
}

/** 240 → «4:00», 59 → «0:59». */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
