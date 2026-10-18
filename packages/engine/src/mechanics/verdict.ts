// Механика "verdict" («Норм или стрём»): ситуация на экране, каждый игрок выбирает «норм» или «стрём», потом ответы открываются разом.
// Вдвоём — экран пополам (ответы открываются, когда ответили оба), втроём и больше — чипы с именами и кнопка «Вскрываемся!».
// Ситуации берутся как в «Кто из нас?» (pickRound): без повторов, пока колода не кончится. Итог: процент совпадений, строже/добрее всех, спорные.
import { pickRound } from "./deck-rounds";
import type { RandomFn } from "../random";

export type Verdict = "norm" | "cringe";

export const VERDICT_MIN_PLAYERS = 2;
export const VERDICT_MAX_PLAYERS = 8;

export interface VerdictSettings {
  /** Имена игроков (2–8). */
  players: string[];
  deckId: string;
}

export type VerdictPhase = "vote" | "reveal" | "final";

export interface VerdictState {
  settings: VerdictSettings;
  /** Номера карточек колоды по порядку. */
  cards: number[];
  /** Номер текущей ситуации (0 — первая). */
  index: number;
  /** Ответы на текущую ситуацию: по игроку, null — ещё не ответил. */
  votes: (Verdict | null)[];
  phase: VerdictPhase;
  /** Открытые ответы прошлых ситуаций (в порядке игры). */
  history: Verdict[][];
}

/** Ситуации нового раунда: без повторов с прошлыми (used — с устройства). */
export function planVerdict(deckSize: number, count: number, used: readonly number[], random?: RandomFn): { cards: number[]; used: number[] } {
  return pickRound(deckSize, count, used, random);
}

export function startVerdict(settings: VerdictSettings, cards: number[]): VerdictState {
  return { settings, cards, index: 0, votes: settings.players.map(() => null), phase: "vote", history: [] };
}

/** Все ответили? Тогда можно «Вскрываемся!» (вдвоём ответы открываются сами). */
export function allVoted(state: VerdictState): boolean {
  return state.votes.every((v) => v !== null);
}

/** Выбор игрока; null — снять ответ. После вскрытия ответы не меняются. */
export function setVerdict(state: VerdictState, player: number, choice: Verdict | null): VerdictState {
  if (state.phase !== "vote" || player < 0 || player >= state.votes.length) return state;
  return { ...state, votes: state.votes.map((v, i) => (i === player ? choice : v)) };
}

/** Тап по чипу в игре компанией: норм → стрём → снять. */
export function cycleVerdict(current: Verdict | null): Verdict | null {
  return current === null ? "norm" : current === "norm" ? "cringe" : null;
}

/** Открыть ответы (только когда ответили все). */
export function revealVerdicts(state: VerdictState): VerdictState {
  if (state.phase !== "vote" || !allVoted(state)) return state;
  return { ...state, phase: "reveal" };
}

/** «Дальше →»: следующая ситуация или итог. */
export function nextVerdict(state: VerdictState): VerdictState {
  if (state.phase !== "reveal") return state;
  const history = [...state.history, state.votes as Verdict[]];
  const index = state.index + 1;
  if (index >= state.cards.length) return { ...state, history, phase: "final" };
  return { ...state, history, index, votes: state.settings.players.map(() => null), phase: "vote" };
}

export interface VerdictTally {
  norm: number;
  cringe: number;
  /** Все ответили одинаково. */
  unanimous: boolean;
  /** Меньшинство — не меньше трети игроков. */
  contested: boolean;
}

export function tallyVerdicts(votes: readonly Verdict[]): VerdictTally {
  const norm = votes.filter((v) => v === "norm").length;
  const cringe = votes.length - norm;
  const minority = Math.min(norm, cringe);
  return { norm, cringe, unanimous: minority === 0, contested: minority > 0 && minority * 3 >= votes.length };
}

export interface VerdictSummary {
  /** Доля ситуаций, где все ответили одинаково (0–100). */
  percent: number;
  /** Игрок, который чаще всех выбирал «стрём» (при ничьей — первый по порядку). */
  strictest: number;
  /** Игрок, который чаще всех выбирал «норм» (при ничьей — первый по порядку, но не тот же, что «строже всех», если есть другой). */
  kindest: number;
  strictCount: number;
  kindCount: number;
  /** Номера ситуаций (в порядке игры), где мнения разошлись. */
  diverged: number[];
}

export function summarizeVerdicts(history: readonly (readonly Verdict[])[], playerCount: number): VerdictSummary {
  const diverged = history.flatMap((votes, i) => (tallyVerdicts([...votes]).unanimous ? [] : [i]));
  const percent = history.length === 0 ? 0 : Math.round(((history.length - diverged.length) / history.length) * 100);
  const cringe = Array.from({ length: playerCount }, (_, p) => history.filter((votes) => votes[p] === "cringe").length);
  const norm = Array.from({ length: playerCount }, (_, p) => history.filter((votes) => votes[p] === "norm").length);
  const strictCount = Math.max(...cringe, 0);
  const kindCount = Math.max(...norm, 0);
  const strictest = Math.max(0, cringe.indexOf(strictCount));
  const kindAll = norm.flatMap((n, i) => (n === kindCount ? [i] : []));
  const kindest = kindAll.find((i) => i !== strictest) ?? kindAll[0] ?? 0;
  return { percent, strictest, kindest, strictCount, kindCount, diverged };
}
