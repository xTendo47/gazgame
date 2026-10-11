import { describe, expect, it } from "vitest";
import { gameSchema, type MatchGame } from "@gazgame/content";
import matchJson from "@gazgame/content/data/games/match-us.json";
import {
  createMatchState,
  deckAccess,
  matchHalves,
  matchReducer,
  nextMatchDeck,
  pickMatchQuestions,
  rankFor,
  scoreMatch,
  seededRandom,
  type MatchState,
} from "../src/index";

const game = gameSchema.parse(matchJson) as MatchGame;

/** Отвечает за текущего игрока по списку вариантов. */
function answerAll(state: MatchState, options: number[]): MatchState {
  let s = state;
  for (const option of options) s = matchReducer(s, { type: "answer", option });
  return s;
}

describe("«Совпадём?» — на настоящем match-us.json", () => {
  it("три уровня по 30 карточек, по 10 вопросов, у каждой ровно 2 варианта; Глубоко под замком", () => {
    expect(game.decks.map((d) => [d.id, d.cards.length, d.questionsPerGame])).toEqual([
      ["light", 30, 10],
      ["serious", 30, 10],
      ["deep", 30, 10],
    ]);
    for (const deck of game.decks) for (const card of deck.cards) expect(card.options).toHaveLength(2);
    expect(deckAccess(game.decks[2]!)).toMatchObject({ open: false, reason: "subscription" });
  });

  it("с подпиской «Глубоко» открывается; другие замки подписка не открывает", () => {
    expect(deckAccess(game.decks[2]!, { userTier: "premium" }).open).toBe(true);
    const soon = { ...game.decks[0]!, locked: { reason: "soon" as const, text: "Скоро" } };
    expect(deckAccess(soon, { userTier: "premium" }).open).toBe(false);
  });

  it("уровни по очереди: Серьёзнее закрыт, пока не доиграли Лайт до итогов; с Premium открыт сразу", () => {
    const [light, serious] = game.decks;
    expect(deckAccess(serious!, { decks: game.decks })).toEqual({ open: false, reason: "after", text: "Сначала пройдите Лайт ☕" });
    expect(deckAccess(serious!, { decks: game.decks, completedDecks: ["light"] }).open).toBe(true);
    expect(deckAccess(serious!, { decks: game.decks, userTier: "premium" }).open).toBe(true);
    expect(deckAccess(light!).open).toBe(true);
  });

  it("следующий уровень: Лайт → Серьёзнее → Глубоко → нет", () => {
    expect(nextMatchDeck(game, "light")?.id).toBe("serious");
    expect(nextMatchDeck(game, "serious")?.id).toBe("deep");
    expect(nextMatchDeck(game, "deep")).toBeUndefined();
  });
});

describe("«Совпадём?» — партия", () => {
  const questions = [3, 7, 1, 9, 0, 4, 12, 20, 5, 8];

  it("оба отвечают на одни и те же вопросы в одном порядке; второй начинает с первого", () => {
    let s = createMatchState(["Маша", "Саша"], questions, seededRandom(1));
    expect(s.phase).toBe("turn");
    s = matchReducer(s, { type: "start" });
    s = answerAll(s, [0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(s).toMatchObject({ phase: "question", turn: 0, index: 9 });
    s = matchReducer(s, { type: "answer", option: 1 });
    expect(s.phase).toBe("pass");
    s = matchReducer(s, { type: "pass" });
    expect(s).toMatchObject({ phase: "question", turn: 1, index: 0, questions });
    s = answerAll(s, [0, 1, 0, 1, 0, 1, 0, 1, 0, 1]);
    expect(s.phase).toBe("result");
    expect(s.answers[0]).toHaveLength(10);
    expect(s.answers[1]).toHaveLength(10);
    expect(matchReducer(s, { type: "answer", option: 0 })).toBe(s); // после итога ответов нет
  });

  it("процент = совпавшие / 10; совпадение по варианту, а не по половине экрана", () => {
    let s = createMatchState(["Маша", "Саша"], questions, seededRandom(2));
    s = matchReducer(s, { type: "start" });
    s = answerAll(s, [0, 0, 0, 0, 0, 0, 0, 1, 1, 1]);
    s = matchReducer(s, { type: "pass" });
    s = answerAll(s, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const score = scoreMatch(s);
    expect(score.percent).toBe(70);
    expect(score.matched).toHaveLength(7);
    expect(score.diverged.map((l) => [l.card, l.a, l.b])).toEqual([
      [20, 1, 0],
      [5, 1, 0],
      [8, 1, 0],
    ]);
    // половины: какой вариант сверху — решено один раз на вопрос, одинаково для обоих
    for (let i = 0; i < questions.length; i++) {
      const [top, bottom] = matchHalves(s, i);
      expect([top, bottom].sort()).toEqual([0, 1]);
      expect(top).toBe(s.swapped[i] ? 1 : 0);
    }
    expect(new Set(s.swapped).size).toBe(2); // на 10 вопросах встречаются оба расклада
  });

  it("звание по проценту: первое, где процент ≥ minPercent", () => {
    expect(rankFor(100, game.ranks).title).toBe("Один мозг на двоих");
    expect(rankFor(70, game.ranks).title).toBe("Хороший дуэт");
    expect(rankFor(0, game.ranks).title).toBe("Противоположности притягиваются");
  });

  it("вопросы не повторяются три игры подряд на одном уровне (30 карточек по 10), потом колода заново", () => {
    const random = seededRandom(7);
    let used: number[] = [];
    const seen: number[] = [];
    for (let g = 0; g < 3; g++) {
      const pick = pickMatchQuestions(30, 10, used, random);
      expect(pick.questions).toHaveLength(10);
      seen.push(...pick.questions);
      used = pick.used;
    }
    expect(new Set(seen).size).toBe(30);
    const fourth = pickMatchQuestions(30, 10, used, random);
    expect(new Set(fourth.questions).size).toBe(10);
    expect(fourth.used).toHaveLength(10);
  });
});
