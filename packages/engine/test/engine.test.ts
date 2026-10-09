import { describe, expect, it } from "vitest";
import { testSchema } from "@gazgame/content";
import loveLanguagesJson from "@gazgame/content/data/tests/love-languages.json";
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
  fillPlaceholders,
  scaleBreakdown,
  scoreTest,
  seededRandom,
  typeMaxima,
  typeRanking,
  voteReducer,
  voteSummary,
  type GuessPartnerState,
} from "../src/index";
import { knowEachOther, selfEsteemLike, temperamentBlend, temperamentLike, truthOrDare, whoInCompany } from "./fixtures";

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

describe("typeRanking — все типы от сильного к слабому", () => {
  it("typeMaxima: максимум баллов каждого типа по вопросам", () => {
    expect(typeMaxima(temperamentBlend)).toEqual({ a: 8, b: 8, c: 8 });
  });

  it("сортирует по баллам, при равенстве — основной, затем второй, затем порядок types", () => {
    const ranking = typeRanking(temperamentBlend, { a: 4, b: 4, c: 2 }, { resultId: "b", blendId: "a" });
    expect(ranking?.map((r) => [r.result.id, r.score, r.max])).toEqual([
      ["b", 4, 8],
      ["a", 4, 8],
      ["c", 2, 8],
    ]);
    // без основного результата равенство решает порядок scoring.types: ["b", "a", "c"]
    expect(typeRanking(temperamentBlend, { a: 3, b: 3, c: 3 })?.map((r) => r.result.id)).toEqual(["b", "a", "c"]);
  });

  it("не принимает неполные, невозможные или несогласованные с результатом баллы", () => {
    expect(typeRanking(temperamentBlend, { a: 1, b: 2 })).toBeNull();
    expect(typeRanking(temperamentBlend, { a: 9, b: 0, c: 0 })).toBeNull();
    expect(typeRanking(temperamentBlend, { a: 5, b: 1, c: 0 }, { resultId: "b" })).toBeNull();
    expect(typeRanking(selfEsteemLike, { a: 1, b: 1, c: 1 })).toBeNull();
  });
});

describe("«Языки любви» — подсчёт на настоящем файле", () => {
  // Настоящий файл из packages/content/data — через ту же схему, что и при загрузке приложения.
  const test = testSchema.parse(loveLanguagesJson);
  /** Для каждого вопроса — вариант, который даёт больше всего баллов языку lang. */
  const answersFor = (lang: string) =>
    test.questions.map((q) => {
      const points = q.options.map((o) => o.scores?.[lang] ?? 0);
      return points.indexOf(Math.max(...points));
    });

  it("13 вопросов, 5 языков, ранжирование включено", () => {
    expect(test.questions).toHaveLength(13);
    expect(test.results.map((r) => r.id)).toEqual(["words", "time", "gifts", "service", "touch"]);
    expect(test.scoring).toMatchObject({ type: "types", showRanking: true });
  });

  it.each(["words", "time", "gifts", "service", "touch"])("если всегда выбирать «%s» — он и побеждает, с полным максимумом", (lang) => {
    const score = scoreTest(test, answersFor(lang));
    expect(score.resultId).toBe(lang);
    expect(score.scores[lang]).toBe(typeMaxima(test)[lang]);
    expect(score.blend).toBeUndefined();
    const ranking = typeRanking(test, score.scores, { resultId: score.resultId });
    expect(ranking?.[0]?.result.id).toBe(lang);
    expect(ranking?.map((r) => r.score)).toEqual([...ranking!.map((r) => r.score)].sort((a, b) => b - a));
  });

  /** Первые k вопросов — за «слова», остальные — за «время». */
  const split = (k: number) => {
    const words = answersFor("words");
    const time = answersFor("time");
    return scoreTest(test, test.questions.map((_, i) => (i < k ? words[i]! : time[i]!)));
  };

  it("ничья 12:12 — побеждает «время», потому что последние вопросы были за него; «слова» — второй язык", () => {
    const score = split(6);
    expect(score.scores).toMatchObject({ words: 12, time: 12 });
    expect(score.resultId).toBe("time");
    expect(score.blend?.resultId).toBe("words");
    expect(typeRanking(test, score.scores, { resultId: "time", blendId: "words" })?.map((r) => r.result.id).slice(0, 2)).toEqual([
      "time",
      "words",
    ]);
  });

  it("разрыв 2 балла (не больше maxGap 3) — смешанный результат", () => {
    const score = split(5);
    expect(score.scores).toMatchObject({ words: 10, time: 12 });
    expect(score.resultId).toBe("time");
    expect(score.blend?.note.title).toContain("слова");
  });

  it("разрыв 8 баллов — чистый результат без второго языка", () => {
    const score = split(8);
    expect(score.scores).toMatchObject({ words: 16, time: 8 });
    expect(score.resultId).toBe("words");
    expect(score.blend).toBeUndefined();
  });
});

describe("scoreTest — подсчёт по шкалам (scales)", () => {
  // Вариант i даёт 3 - i баллов. Вопросы по кругу: a, b, c, a, b, c.
  it("считает баллы шкал, сумму и результат по range", () => {
    const score = scoreTest(selfEsteemLike, [0, 1, 3, 1, 2, 3]); // a=3+2, b=2+1, c=0+0
    expect(score.scores).toEqual({ a: 5, b: 3, c: 0 });
    expect(score.scales?.total).toBe(8);
    expect(score.scales?.totalMax).toBe(18);
    expect(score.resultId).toBe("mid");
  });

  it("границы диапазонов: 6 — нижний результат, 7 — средний", () => {
    expect(scoreTest(selfEsteemLike, [0, 0, 3, 3, 3, 3]).resultId).toBe("low"); // 3+3+0
    expect(scoreTest(selfEsteemLike, [0, 0, 2, 3, 3, 3]).resultId).toBe("mid"); // 3+3+1
    expect(scoreTest(selfEsteemLike, [0, 0, 0, 0, 0, 0]).resultId).toBe("high");
  });

  it("уровень и текст зоны по каждой шкале", () => {
    const scales = scoreTest(selfEsteemLike, [0, 1, 3, 1, 2, 3]).scales!.scales;
    expect(scales.map((s) => [s.scale.id, s.level, s.zone])).toEqual([
      ["a", "high", "a-high"],
      ["b", "mid", "b-mid"],
      ["c", "low", "c-low"],
    ]);
  });

  it("самая сильная шкала — опора, самая слабая — зона роста", () => {
    const { profile, weakest } = scoreTest(selfEsteemLike, [0, 1, 3, 1, 2, 3]).scales!;
    expect(profile.kind).toBe("peaks");
    if (profile.kind !== "peaks") return;
    expect(profile.strongest.scale.id).toBe("a");
    expect(profile.weakest.scale.id).toBe("c");
    expect(weakest.scale.id).toBe("c");
  });

  it("при равных баллах опорой и зоной роста становится шкала, что раньше в списке", () => {
    const { profile } = scaleBreakdown(selfEsteemLike, { a: 2, b: 6, c: 6 })!; // b и c по 6
    expect(profile).toMatchObject({ kind: "peaks", strongest: { scale: { id: "b" } }, weakest: { scale: { id: "a" } } });
    const tiedLow = scaleBreakdown(selfEsteemLike, { a: 6, b: 1, c: 1 })!;
    expect(tiedLow.profile).toMatchObject({ kind: "peaks", weakest: { scale: { id: "b" } } });
  });

  it("ровный профиль, если шкалы отличаются не больше чем на flatGap", () => {
    const score = scoreTest(selfEsteemLike, [0, 0, 0, 1, 1, 0]); // a=5, b=5, c=6
    expect(score.scores).toEqual({ a: 5, b: 5, c: 6 });
    expect(score.scales?.profile).toEqual({ kind: "flat" });
    expect(score.scales?.weakest.scale.id).toBe("a"); // зона роста для upsell всё равно известна
    expect(scaleBreakdown(selfEsteemLike, { a: 4, b: 6, c: 6 })?.profile.kind).toBe("peaks"); // разрыв 2
  });

  it("scaleBreakdown не принимает неполные или невозможные баллы (например, из чужой ссылки)", () => {
    expect(scaleBreakdown(selfEsteemLike, { a: 1, b: 2 })).toBeNull();
    expect(scaleBreakdown(selfEsteemLike, { a: 1, b: 2, c: 7 })).toBeNull();
    expect(scaleBreakdown(selfEsteemLike, { a: 1, b: 2, c: Number.NaN })).toBeNull();
    expect(scaleBreakdown(temperamentLike, { a: 1 })).toBeNull();
  });

  it("старые тесты не получают шкал", () => {
    expect(scoreTest(temperamentLike, [1, 1, 0]).scales).toBeUndefined();
  });
});

describe("fillPlaceholders — подстановка в тексты", () => {
  const text = "Твоя зона роста — «{weakestScale}». В разборе: практика на 14 дней.";

  it("подставляет значение", () => {
    expect(fillPlaceholders(text, { weakestScale: "Принятие себя" })).toBe(
      "Твоя зона роста — «Принятие себя». В разборе: практика на 14 дней.",
    );
  });

  it("убирает предложение, если значения нет", () => {
    expect(fillPlaceholders(text, {})).toBe("В разборе: практика на 14 дней.");
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
