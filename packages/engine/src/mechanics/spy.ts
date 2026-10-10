// Механика "spy": у всех одна карта из набора, у шпиона (или двух) — «Ты шпион». Один телефон, имён нет.
// Здесь: настройки по умолчанию, выбор карты без повторов, раздача и подсчёт победы.
import type { SpyCard, SpyDeck, SpyGame } from "@gazgame/content";
import { shuffle, type RandomFn } from "../random";

// ---------- Настройки ----------

/** Наборы, из которых берётся карта: выбранный или все сразу («Всё вперемешку»). */
export function spyDecksFor(game: SpyGame, choiceId: string): SpyDeck[] {
  if (choiceId === game.mix.id) return game.decks;
  return game.decks.filter((d) => d.id === choiceId);
}

/** Сколько шпионов можно: два — только если останется хотя бы двое своих. */
export function maxSpies(game: SpyGame, players: number): number {
  return players >= 4 ? game.spies.max : 1;
}

/** Шпионов по умолчанию: с twoFrom игроков — двое, иначе один. */
export function defaultSpies(game: SpyGame, players: number): number {
  return players >= game.spies.twoFrom ? Math.min(2, maxSpies(game, players)) : 1;
}

/** Таймер по умолчанию: perPlayerSec × игроков в пределах minSec–maxSec, кратно шагу. */
export function defaultTimerSec(game: SpyGame, players: number): number {
  const { perPlayerSec, minSec, maxSec, stepSec } = game.timer;
  const raw = Math.min(maxSec, Math.max(minSec, perPlayerSec * players));
  const stepped = Math.round(raw / stepSec) * stepSec;
  return Math.min(maxSec, Math.max(minSec, stepped));
}

// ---------- Карта партии ----------

/** Сыгранные карты по наборам: id набора → id карт (хранится на устройстве). */
export type UsedSpyCards = Record<string, string[]>;

export interface SpyPick {
  deckId: string;
  card: SpyCard;
  /** Что считать сыгранным после этой партии. */
  used: UsedSpyCards;
}

/**
 * Карта на новую партию: без повторов, пока набор не кончится; кончился — набор начинается заново.
 * В «Всё вперемешку» карта берётся из всех наборов сразу, сыгранные отмечаются в своём наборе.
 */
export function pickSpyCard(game: SpyGame, choiceId: string, used: UsedSpyCards, random: RandomFn = Math.random): SpyPick {
  const decks = spyDecksFor(game, choiceId);
  if (decks.length === 0) throw new Error(`Нет набора "${choiceId}"`);
  const next: UsedSpyCards = { ...used };
  const freshOf = (deck: SpyDeck) => {
    const done = new Set(next[deck.id] ?? []);
    return deck.cards.filter((c) => !done.has(c.id)).map((card) => ({ deckId: deck.id, card }));
  };
  let pool = decks.flatMap(freshOf);
  if (pool.length === 0) {
    for (const deck of decks) next[deck.id] = [];
    pool = decks.flatMap(freshOf);
  }
  const picked = pool[Math.floor(random() * pool.length)] ?? pool[0];
  if (!picked) throw new Error(`В наборе "${choiceId}" нет карт`);
  next[picked.deckId] = [...(next[picked.deckId] ?? []), picked.card.id];
  return { ...picked, used: next };
}

// ---------- Раздача ----------

/** Карты по порядку игроков: true — «Ты шпион», false — карта со словом. */
export function dealSpy(players: number, spies: number, random: RandomFn = Math.random): boolean[] {
  if (spies < 1 || spies >= players) throw new Error(`Шпионов должно быть от 1 до ${players - 1}`);
  return shuffle(
    Array.from({ length: players }, (_, i) => i < spies),
    random,
  );
}

/** Кто начинает: номер игрока с нуля. */
export function pickStarter(players: number, random: RandomFn = Math.random): number {
  return Math.min(players - 1, Math.floor(random() * players));
}

// ---------- Партия ----------

export type SpyWinReason = "wrong-vote" | "guessed" | "time";

export type SpyOutcome = { winner: "city" } | { winner: "spy"; reason: SpyWinReason };

export interface SpyMatch {
  /** Номера шпионов (с нуля), по возрастанию. */
  spies: number[];
  /** Пойманные шпионы по порядку. */
  caught: number[];
  /** Итог; null — игра идёт. */
  outcome: SpyOutcome | null;
}

export function createSpyMatch(cards: readonly boolean[]): SpyMatch {
  return { spies: cards.flatMap((isSpy, i) => (isSpy ? [i] : [])), caught: [], outcome: null };
}

/** Непойманный шпион. */
export function isActiveSpy(match: SpyMatch, player: number): boolean {
  return match.spies.includes(player) && !match.caught.includes(player);
}

export function spiesLeft(match: SpyMatch): number {
  return match.spies.length - match.caught.length;
}

function catchSpy(match: SpyMatch, player: number): SpyMatch {
  const caught = [...match.caught, player];
  return { ...match, caught, outcome: caught.length === match.spies.length ? { winner: "city" } : null };
}

/** «Голосуем»: вскрыли шпиона — он пойман (все пойманы — победа своих), вскрыли своего — победил шпион. */
export function spyVote(match: SpyMatch, player: number): SpyMatch {
  if (match.outcome || match.caught.includes(player)) return match;
  if (isActiveSpy(match, player)) return catchSpy(match, player);
  return { ...match, outcome: { winner: "spy", reason: "wrong-vote" } };
}

/** Шпион раскрылся и назвал слово: угадал — победил, мимо — пойман. Не шпион — ничего не меняется. */
export function spyGuess(match: SpyMatch, player: number, guessed: boolean): SpyMatch {
  if (match.outcome || !isActiveSpy(match, player)) return match;
  return guessed ? { ...match, outcome: { winner: "spy", reason: "guessed" } } : catchSpy(match, player);
}

/** Время вышло, и голосовать не стали — победил шпион. */
export function spyTimeOut(match: SpyMatch): SpyMatch {
  return match.outcome ? match : { ...match, outcome: { winner: "spy", reason: "time" } };
}

export function spyWinner(match: SpyMatch): "city" | "spy" | null {
  return match.outcome?.winner ?? null;
}
