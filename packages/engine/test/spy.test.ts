import { describe, expect, it } from "vitest";
import { gameSchema, type SpyGame } from "@gazgame/content";
import spyJson from "@gazgame/content/data/games/spy.json";
import {
  createSpyMatch,
  dealSpy,
  defaultSpies,
  defaultTimerSec,
  maxSpies,
  pickSpyCard,
  pickStarter,
  seededRandom,
  spiesLeft,
  spyDecksFor,
  spyTimerLevel,
  spyGuess,
  spyTimeOut,
  spyVote,
  spyWinner,
  type UsedSpyCards,
} from "../src/index";

const spy = gameSchema.parse(spyJson) as SpyGame;

describe("«Шпион» — настройки на настоящем spy.json", () => {
  it("три набора по 52 карты и «Всё вперемешку» из всех", () => {
    expect(spy.decks.map((d) => d.id)).toEqual(["places", "jobs", "countries"]);
    for (const deck of spy.decks) expect(deck.cards).toHaveLength(52);
    expect(spyDecksFor(spy, spy.mix.id)).toHaveLength(3);
    expect(spyDecksFor(spy, "jobs").map((d) => d.id)).toEqual(["jobs"]);
  });

  it("шпионов по умолчанию: один, с twoFrom игроков — двое; два — только от 4 игроков", () => {
    expect(defaultSpies(spy, 3)).toBe(1);
    expect(defaultSpies(spy, 7)).toBe(1);
    expect(defaultSpies(spy, spy.spies.twoFrom)).toBe(2);
    expect(defaultSpies(spy, 12)).toBe(2);
    expect(maxSpies(spy, 3)).toBe(1);
    expect(maxSpies(spy, 4)).toBe(2);
  });

  it("таймер: от 1 до 10 минут с шагом в минуту, по умолчанию минута на игрока", () => {
    expect(spy.timer).toMatchObject({ minSec: 60, maxSec: 600, stepSec: 60 });
    expect(defaultTimerSec(spy, 3)).toBe(180);
    expect(defaultTimerSec(spy, 7)).toBe(420);
    expect(defaultTimerSec(spy, 12)).toBe(600);
  });

  it("подпись сложности: 1–2 мин проще, 3–5 честно, 6–10 сложнее", () => {
    expect([60, 120, 180, 300, 360, 600].map(spyTimerLevel)).toEqual(["easy", "easy", "fair", "fair", "hard", "hard"]);
  });
});

describe("«Шпион» — раздача", () => {
  const counts = (cards: boolean[]) => ({ word: cards.filter((c) => !c).length, spy: cards.filter(Boolean).length });

  it("ровно N−1 карт со словом и 1 шпион или N−2 и 2 шпиона", () => {
    for (const players of [3, 7, 12]) {
      expect(counts(dealSpy(players, 1))).toEqual({ word: players - 1, spy: 1 });
      if (players >= 4) expect(counts(dealSpy(players, 2))).toEqual({ word: players - 2, spy: 2 });
    }
    expect(() => dealSpy(3, 3)).toThrow();
    expect(() => dealSpy(3, 0)).toThrow();
  });

  it("порядок случайный: шпион оказывается на разных местах", () => {
    const random = seededRandom(7);
    const places = new Set(Array.from({ length: 60 }, () => dealSpy(7, 1, random).indexOf(true)));
    expect(places.size).toBe(7);
    expect(dealSpy(7, 2, seededRandom(3))).toEqual(dealSpy(7, 2, seededRandom(3))); // одно зерно — один порядок
  });

  it("начинает любой игрок из партии", () => {
    const random = seededRandom(11);
    const starters = new Set(Array.from({ length: 100 }, () => pickStarter(5, random)));
    expect([...starters].sort()).toEqual([0, 1, 2, 3, 4]);
  });
});

describe("«Шпион» — карта партии без повторов", () => {
  it("набор проходится целиком без повторов, потом начинается заново", () => {
    const random = seededRandom(5);
    let used: UsedSpyCards = {};
    const seen: string[] = [];
    for (let i = 0; i < 52; i++) {
      const pick = pickSpyCard(spy, "places", used, random);
      expect(pick.deckId).toBe("places");
      seen.push(pick.card.id);
      used = pick.used;
    }
    expect(new Set(seen).size).toBe(52);
    expect(used.places).toHaveLength(52);
    const after = pickSpyCard(spy, "places", used, random);
    expect(after.used.places).toEqual([after.card.id]); // колода кончилась — заново
  });

  it("сыгранные в одном наборе не трогают другие", () => {
    const pick = pickSpyCard(spy, "jobs", { places: ["kofeynya"] }, seededRandom(1));
    expect(pick.used).toEqual({ places: ["kofeynya"], jobs: [pick.card.id] });
  });

  it("«Всё вперемешку» берёт из всех трёх наборов и отмечает карту в её наборе", () => {
    const random = seededRandom(9);
    let used: UsedSpyCards = {};
    const decks = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const pick = pickSpyCard(spy, spy.mix.id, used, random);
      expect(spy.decks.find((d) => d.id === pick.deckId)?.cards).toContainEqual(pick.card);
      decks.add(pick.deckId);
      used = pick.used;
    }
    expect([...decks].sort()).toEqual(["countries", "jobs", "places"]);
    const total = Object.values(used).reduce((sum, ids) => sum + ids.length, 0);
    expect(total).toBe(40);
    expect(new Set(Object.entries(used).flatMap(([d, ids]) => ids.map((id) => `${d}:${id}`))).size).toBe(40);
  });

  it("в «Всё вперемешку» не повторяет карты, уже сыгранные в отдельном наборе", () => {
    const places = spy.decks[0]!;
    const used: UsedSpyCards = { places: places.cards.slice(1).map((c) => c.id), jobs: spy.decks[1]!.cards.map((c) => c.id), countries: spy.decks[2]!.cards.map((c) => c.id) };
    const pick = pickSpyCard(spy, spy.mix.id, used, seededRandom(2));
    expect(pick.card.id).toBe(places.cards[0]!.id);
  });
});

describe("«Шпион» — подсчёт победы", () => {
  // игрок 2 — шпион (один), или игроки 1 и 4 (два)
  const one = () => createSpyMatch([false, false, true, false, false]);
  const two = () => createSpyMatch([false, true, false, false, true, false, false, false]);

  it("один шпион: поймали — победили свои", () => {
    const match = spyVote(one(), 2);
    expect(match.caught).toEqual([2]);
    expect(spyWinner(match)).toBe("city");
  });

  it("вскрыли своего — победил шпион", () => {
    const match = spyVote(one(), 0);
    expect(match.outcome).toEqual({ winner: "spy", reason: "wrong-vote" });
    expect(spyVote(match, 2)).toBe(match); // игра окончена
  });

  it("два шпиона: первый пойман — игра идёт, второй пойман — победили свои", () => {
    let match = spyVote(two(), 4);
    expect(spyWinner(match)).toBeNull();
    expect(spiesLeft(match)).toBe(1);
    expect(spyVote(match, 4)).toBe(match); // пойманного второй раз не ловим
    match = spyVote(match, 1);
    expect(spyWinner(match)).toBe("city");
  });

  it("два шпиона: первый пойман, потом вскрыли своего — победил шпион", () => {
    const match = spyVote(spyVote(two(), 1), 0);
    expect(match.outcome).toEqual({ winner: "spy", reason: "wrong-vote" });
  });

  it("шпион раскрылся: угадал — победил; мимо — пойман", () => {
    expect(spyGuess(one(), 2, true).outcome).toEqual({ winner: "spy", reason: "guessed" });
    expect(spyWinner(spyGuess(one(), 2, false))).toBe("city");
    const missed = spyGuess(two(), 1, false);
    expect(spyWinner(missed)).toBeNull();
    expect(spiesLeft(missed)).toBe(1);
    expect(spyGuess(missed, 4, true).outcome).toEqual({ winner: "spy", reason: "guessed" });
  });

  it("раскрылся не шпион — ничего не меняется", () => {
    const match = one();
    expect(spyGuess(match, 0, true)).toBe(match);
  });

  it("время вышло и не голосуем — победил шпион", () => {
    expect(spyTimeOut(one()).outcome).toEqual({ winner: "spy", reason: "time" });
    const won = spyVote(one(), 2);
    expect(spyTimeOut(won)).toBe(won);
  });
});
