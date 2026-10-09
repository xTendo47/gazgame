import { describe, expect, it } from "vitest";
import {
  castVote,
  createDeckState,
  createGuessPartnerState,
  createMemoryKeyValueStore,
  createProgressStore,
  createVoteState,
  currentVoter,
  deckReducer,
  guessPartnerReducer,
  hasAccess,
  isExhausted,
  isVisible,
  nextRound,
  rankFor,
  scoreGuessPartner,
  blendPairs,
  scoreTest,
  seededRandom,
  voteReducer,
  voteSummary,
  type GuessPartnerState,
} from "../src/index";
import { knowEachOther, temperamentBlend, temperamentLike, truthOrDare, whoInCompany } from "./fixtures";

describe("scoreTest — подсчёт теста", () => {
  it("побеждает тип с наибольшим счётом", () => {
    expect(scoreTest(temperamentLike, [1, 1, 0]).resultId).toBe("b");
  });

  it("учитывает баллы из scores", () => {
    // a=1, c=1, затем вариант «b+c» даёт b+1, c+2 → c=3
    const score = scoreTest(temperamentLike, [0, 2, 1]);
    expect(score.scores).toEqual({ a: 1, b: 1, c: 3 });
    expect(score.resultId).toBe("c");
  });

  it("при ничьей побеждает результат, который раньше в списке", () => {
    expect(scoreTest(temperamentLike, [1, 2, 0]).scores).toEqual({ a: 1, b: 1, c: 1 });
    expect(scoreTest(temperamentLike, [1, 2, 0]).resultId).toBe("a");
  });

  it("ругается на неполные ответы и несуществующий вариант", () => {
    expect(() => scoreTest(temperamentLike, [0])).toThrow();
    expect(() => scoreTest(temperamentLike, [0, 0, 9])).toThrow();
  });
});

describe("scoreTest — новый формат (scores, ничья, смесь)", () => {
  it("суммирует баллы по типам, включая варианты сразу на два типа", () => {
    // q1 a(+2), q2 a(+2), q3 a+b(+1/+1), q4 c(+2)
    const score = scoreTest(temperamentBlend, [0, 0, 3, 2]);
    expect(score.scores).toEqual({ a: 5, b: 1, c: 2 });
    expect(score.resultId).toBe("a");
  });

  it("явный лидер — без смеси, если второй отстал больше чем на maxGap", () => {
    const score = scoreTest(temperamentBlend, [0, 0, 0, 1]); // a=6, b=2
    expect(score.resultId).toBe("a");
    expect(score.blend).toBeUndefined();
  });

  it("ничья: побеждает тот, кто набрал больше в последних вопросах", () => {
    const score = scoreTest(temperamentBlend, [0, 0, 1, 1]); // a=4, b=4, но в q4 выбран b
    expect(score.scores).toMatchObject({ a: 4, b: 4 });
    expect(score.resultId).toBe("b");
    expect(score.blend?.resultId).toBe("a");
  });

  it("ничья и в последних вопросах: решает порядок scoring.types, второй уходит в смесь", () => {
    const score = scoreTest(temperamentBlend, [0, 1, 3, 2]); // a=3, b=3, c=2; в q4 — c
    expect(score.scores).toEqual({ a: 3, b: 3, c: 2 });
    expect(score.resultId).toBe("b"); // types: ["b", "a", "c"]
    expect(score.blend?.resultId).toBe("a");
  });

  it("смешанный результат, если разрыв не больше maxGap", () => {
    const score = scoreTest(temperamentBlend, [0, 0, 3, 1]); // a=5, b=3 → разрыв 2
    expect(score.resultId).toBe("a");
    expect(score.blend).toMatchObject({ resultId: "b", note: { title: "с нотками b" } });
  });

  it("смеси нет, если для второго типа нет blendNotes", () => {
    const score = scoreTest(temperamentBlend, [0, 0, 2, 2]); // a=4, c=4 → в q4 c → c, второй a — есть нотка
    expect(score.resultId).toBe("c");
    expect(score.blend?.resultId).toBe("a");
    const noC = scoreTest(temperamentBlend, [2, 2, 0, 0]); // c=4, a=4 → в q4 a → a, второй c — нотки нет
    expect(noC.resultId).toBe("a");
    expect(noC.blend).toBeUndefined();
  });

  it("старый формат не даёт смеси", () => {
    expect(scoreTest(temperamentLike, [1, 2, 0]).blend).toBeUndefined();
    expect(blendPairs(temperamentLike)).toEqual([]);
  });

  it("blendPairs перечисляет все пары с нотками", () => {
    expect(blendPairs(temperamentBlend)).toEqual([
      { resultId: "a", blendId: "b" },
      { resultId: "b", blendId: "a" },
      { resultId: "c", blendId: "a" },
      { resultId: "c", blendId: "b" },
    ]);
  });
});

describe("deck — колода карточек", () => {
  const deck = truthOrDare.decks[0]!;

  it("раздаёт каждую карточку ровно один раз, отдельно по типам", () => {
    let state = createDeckState(deck, { typed: true, random: seededRandom(1) });
    const seen: string[] = [];
    for (const type of ["truth", "truth", "dare"]) {
      state = deckReducer(state, { type: "draw", cardType: type });
      seen.push(deck.cards[state.current!]!.text);
    }
    expect(seen.slice(0, 2).sort()).toEqual(["t1", "t2"]);
    expect(seen[2]).toBe("d1");
    expect(isExhausted(state)).toBe(true);
    expect(deckReducer(state, { type: "draw", cardType: "truth" }).current).toBeNull();
  });

  it("одинаковое зерно — одинаковый порядок", () => {
    const a = createDeckState(deck, { random: seededRandom(42) });
    const b = createDeckState(deck, { random: seededRandom(42) });
    expect(a.queues).toEqual(b.queues);
  });
});

describe("vote — «Кто из компании?»", () => {
  const deck = whoInCompany.decks[0]!;
  const players = ["Аня", "Боря", "Вика"];

  it("требует минимум 3 игрока и чистит пустые имена", () => {
    expect(() => createVoteState(["Аня", "  ", "Боря"], deck)).toThrow();
    expect(createVoteState([" Аня ", "Боря", "Вика", ""], deck).players).toEqual(["Аня", "Боря", "Вика"]);
  });

  it("проходит раунды и выдаёт звания победителям", () => {
    let state = createVoteState(players, deck, { random: seededRandom(3) });
    const firstCard = deck.cards[state.questions[0]!]!;
    for (const target of [1, 1, 2]) {
      expect(currentVoter(state)).toBeLessThan(3);
      state = voteReducer(state, { type: "vote", target });
    }
    expect(state.phase).toBe("reveal");
    state = nextRound(state);
    for (const target of [0, 1, 0]) state = castVote(state, target);
    state = voteReducer(state, { type: "next" });
    expect(state.phase).toBe("finished");

    const summary = voteSummary(state, deck);
    expect(summary.players[1]!.awards).toContain(firstCard.award);
    expect(summary.players.map((p) => p.totalVotes)).toEqual([2, 3, 1]);
    expect(summary.stars).toEqual([1]);
  });

  it("досрочный финиш учитывает только завершённые раунды", () => {
    let state = createVoteState(players, deck, { random: seededRandom(3) });
    state = castVote(state, 0);
    state = voteReducer(state, { type: "finish" });
    expect(voteSummary(state, deck).stars).toEqual([]);
  });
});

describe("guess-partner — «Насколько хорошо вы знаете друг друга»", () => {
  const deck = knowEachOther.decks[0]!;

  function play(answers: number[]): GuessPartnerState {
    let state = createGuessPartnerState(["Маша", "Саша"], deck);
    const queue = [...answers];
    while (state.phase !== "finished") {
      state =
        state.phase === "handoff"
          ? guessPartnerReducer(state, { type: "continue" })
          : guessPartnerReducer(state, { type: "answer", option: queue.shift()! });
    }
    return state;
  }

  it("100%, если оба всё угадали", () => {
    // Маша: q1 self 0, guess 1; q2 self 1, guess 0. Саша: q1 self 1, guess 0; q2 self 0, guess 1
    const score = scoreGuessPartner(play([0, 1, 1, 0, 1, 0, 0, 1]));
    expect(score).toMatchObject({ matches: 4, total: 4, percent: 100, correctByPlayer: [2, 2] });
  });

  it("считает частичные совпадения", () => {
    // Маша угадала только q1, Саша не угадала ничего
    const score = scoreGuessPartner(play([0, 1, 1, 1, 1, 1, 0, 0]));
    expect(score).toMatchObject({ matches: 1, total: 4, percent: 25, correctByPlayer: [1, 0] });
  });

  it("делает паузу «передай телефон» после первого игрока", () => {
    let state = createGuessPartnerState(["Маша", "Саша"], deck);
    for (let i = 0; i < 4; i++) state = guessPartnerReducer(state, { type: "answer", option: 0 });
    expect(state.phase).toBe("handoff");
    expect(state.player).toBe(1);
    expect(guessPartnerReducer(state, { type: "answer", option: 0 })).toBe(state);
  });

  it("выбирает звание по проценту", () => {
    expect(rankFor(100, knowEachOther.ranks).title).toBe("Телепаты");
    expect(rankFor(50, knowEachOther.ranks).title).toBe("Ещё знакомитесь");
    expect(rankFor(0, knowEachOther.ranks).title).toBe("Загадки");
  });
});

describe("тиры и видимость", () => {
  it("подписка открывает уровни ниже своего", () => {
    expect(hasAccess("free", "free")).toBe(true);
    expect(hasAccess("free", "premium")).toBe(false);
    expect(hasAccess("supreme", "premium")).toBe(true);
    expect(hasAccess("premium", "supreme")).toBe(false);
  });

  it("18+ скрыт без возрастного гейта, черновики можно скрыть", () => {
    expect(isVisible({ ...temperamentLike, ageRating: "18+" })).toBe(false);
    expect(isVisible({ ...temperamentLike, ageRating: "18+" }, { allowAdult: true })).toBe(true);
    expect(isVisible(temperamentLike, { includeDrafts: false })).toBe(false);
  });
});

describe("storage — прогресс", () => {
  it("сохраняет результаты тестов и счётчик игр", () => {
    const store = createProgressStore(createMemoryKeyValueStore());
    store.saveTestResult("temperament", "choleric", new Date("2026-01-01"));
    store.recordGamePlayed("know", { score: 50 });
    store.recordGamePlayed("know", { score: 75 });
    store.recordGamePlayed("know", { score: 25 });
    expect(store.getTestResult("temperament")?.resultId).toBe("choleric");
    expect(store.load().games.know).toMatchObject({ playedCount: 3, bestScore: 75 });
  });

  it("не падает на испорченных данных", () => {
    const kv = createMemoryKeyValueStore();
    kv.setItem("gazgame:progress:v1", "{не json");
    expect(createProgressStore(kv).load().tests).toEqual({});
  });

  it("работает без хранилища (null)", () => {
    const store = createProgressStore(null);
    store.saveTestResult("x", "y");
    expect(store.getTestResult("x")?.resultId).toBe("y");
  });
});
