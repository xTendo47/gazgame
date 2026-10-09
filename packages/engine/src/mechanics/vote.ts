// Механика "vote": «Кто из компании?».
// Игроки по очереди тайно голосуют за кого-то из компании, после раунда — итог раунда,
// в конце — звания (award из карточки) для победителей раундов.
import type { Deck } from "@gazgame/content";
import { range, shuffle, type RandomFn } from "../random";

export interface VoteState {
  players: string[];
  /** Индексы карточек колоды в порядке игры. */
  questions: number[];
  round: number;
  /** votes[раунд][кто голосует] = за кого (индекс игрока). */
  votes: number[][];
  phase: "voting" | "reveal" | "finished";
}

export type VoteAction = { type: "vote"; target: number } | { type: "next" } | { type: "finish" };

export const VOTE_MIN_PLAYERS = 3;

/** Чистит список имён: убирает пробелы и пустые строки. */
export function normalizePlayers(names: readonly string[]): string[] {
  return names.map((n) => n.trim()).filter((n) => n.length > 0);
}

export function createVoteState(
  players: readonly string[],
  deck: Deck,
  { random, rounds }: { random?: RandomFn; rounds?: number } = {},
): VoteState {
  const names = normalizePlayers(players);
  if (names.length < VOTE_MIN_PLAYERS) throw new Error(`Нужно минимум ${VOTE_MIN_PLAYERS} игрока`);
  const questions = shuffle(range(deck.cards.length), random).slice(0, rounds ?? deck.cards.length);
  return { players: names, questions, round: 0, votes: [[]], phase: "voting" };
}

/** Индекс игрока, который сейчас голосует. */
export function currentVoter(state: VoteState): number {
  return state.votes[state.round]?.length ?? 0;
}

export function castVote(state: VoteState, target: number): VoteState {
  if (state.phase !== "voting" || target < 0 || target >= state.players.length) return state;
  const roundVotes = [...(state.votes[state.round] ?? []), target];
  const votes = state.votes.map((v, i) => (i === state.round ? roundVotes : v));
  const phase = roundVotes.length >= state.players.length ? "reveal" : "voting";
  return { ...state, votes, phase };
}

export function nextRound(state: VoteState): VoteState {
  if (state.phase !== "reveal") return state;
  if (state.round + 1 >= state.questions.length) return { ...state, phase: "finished" };
  return { ...state, round: state.round + 1, votes: [...state.votes, []], phase: "voting" };
}

/** Закончить игру досрочно: учитываются только завершённые раунды. */
export function finishVote(state: VoteState): VoteState {
  return { ...state, phase: "finished" };
}

export interface RoundResult {
  /** Сколько голосов получил каждый игрок. */
  counts: number[];
  /** Победители раунда (несколько при ничьей). Пусто, если голосов не было. */
  winners: number[];
}

export function roundResult(state: VoteState, round = state.round): RoundResult {
  const counts = state.players.map(() => 0);
  for (const target of state.votes[round] ?? []) counts[target] = (counts[target] ?? 0) + 1;
  const max = Math.max(0, ...counts);
  const winners = max === 0 ? [] : range(counts.length).filter((i) => counts[i] === max);
  return { counts, winners };
}

/** Раунды, где проголосовали все. */
export function completedRounds(state: VoteState): number[] {
  return range(state.votes.length).filter((r) => (state.votes[r]?.length ?? 0) >= state.players.length);
}

export interface PlayerSummary {
  name: string;
  totalVotes: number;
  /** Звания за выигранные раунды. */
  awards: string[];
}

export interface VoteSummary {
  players: PlayerSummary[];
  /** Индексы игроков с наибольшим числом голосов за всю игру — «Звезда вечера». */
  stars: number[];
}

export function voteSummary(state: VoteState, deck: Deck): VoteSummary {
  const players: PlayerSummary[] = state.players.map((name) => ({ name, totalVotes: 0, awards: [] }));
  for (const round of completedRounds(state)) {
    const { counts, winners } = roundResult(state, round);
    counts.forEach((count, i) => {
      const player = players[i];
      if (player) player.totalVotes += count;
    });
    const card = deck.cards[state.questions[round] ?? -1];
    for (const winner of winners) {
      players[winner]?.awards.push(card?.award ?? card?.text ?? "");
    }
  }
  const max = Math.max(0, ...players.map((p) => p.totalVotes));
  const stars = max === 0 ? [] : range(players.length).filter((i) => players[i]?.totalVotes === max);
  return { players, stars };
}

export function voteReducer(state: VoteState, action: VoteAction): VoteState {
  switch (action.type) {
    case "vote":
      return castVote(state, action.target);
    case "next":
      return nextRound(state);
    case "finish":
      return finishVote(state);
  }
}
