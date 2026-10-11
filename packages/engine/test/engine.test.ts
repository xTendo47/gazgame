import { describe, expect, it } from "vitest";
import { gameSchema, testSchema, type MafiaGame } from "@gazgame/content";
import loveLanguagesJson from "@gazgame/content/data/tests/love-languages.json";
import mafiaJson from "@gazgame/content/data/games/mafia.json";
import companyRoleJson from "@gazgame/content/data/tests/company-role.json";
import selfEsteemJson from "@gazgame/content/data/tests/self-esteem.json";
import superpowerJson from "@gazgame/content/data/tests/superpower.json";
import temperamentJson from "@gazgame/content/data/tests/temperament.json";
import {
  castVote,
  aliveSides,
  checkLineup,
  createDeckState,
  createMatch,
  dealRoles,
  defaultLineup,
  eliminate,
  undoElimination,
  winner,
  createRoundState,
  createGuessPartnerState,
  currentView,
  deckAccess,
  createMemoryKeyValueStore,
  createProgressStore,
  createVoteState,
  currentVoter,
  deckReducer,
  guessPartnerReducer,
  nextDeck,
  pickQuestions,
  playedCards,
  hasAccess,
  isExhausted,
  isVisible,
  findLockedTest,
  afterWhen,
  audienceForLabel,
  isAudience,
  questionTexts,
  answerBackMessage,
  ingredientsLine,
  partnerLabel,
  receiptNumber,
  supportScale,
  topTwo,
  largestRemainderPercents,
  parseSharedResult,
  sharedResultMeta,
  sharedResultQuery,
  shareButtonLabel,
  shareMessage,
  listCopyText,
  splitListLabel,
  lockedTestsForSection,
  nextRound,
  pickHint,
  pickRound,
  roundReducer,
  randomPool,
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

describe("шеринг: проценты и текст сообщения", () => {
  it("метод наибольшего остатка: ровно 100 в сумме", () => {
    expect(largestRemainderPercents([1, 1, 1])).toEqual([34, 33, 33]); // ничья — тому, кто раньше
    expect(largestRemainderPercents([20, 2, 2, 0, 0])).toEqual([84, 8, 8, 0, 0]);
    expect(largestRemainderPercents([12, 12, 0, 0, 2])).toEqual([46, 46, 0, 0, 8]);
    expect(largestRemainderPercents([5])).toEqual([100]);
    expect(largestRemainderPercents([0, 0, 0])).toEqual([0, 0, 0]);
    expect(largestRemainderPercents([])).toEqual([]);
  });

  it("на случайных наборах: сумма 100, каждое число — округление вниз или вверх точной доли", () => {
    const random = seededRandom(9);
    for (let k = 0; k < 300; k++) {
      const values = Array.from({ length: 2 + Math.floor(random() * 6) }, () => Math.floor(random() * 25));
      const total = values.reduce((a, b) => a + b, 0);
      const pct = largestRemainderPercents(values);
      if (total === 0) continue;
      expect(pct.reduce((a, b) => a + b, 0)).toBe(100);
      pct.forEach((p, i) => {
        const exact = ((values[i] ?? 0) / total) * 100;
        expect(p === Math.floor(exact) || p === Math.floor(exact) + 1).toBe(true);
      });
    }
  });

  it("проценты в «Твой расклад» — те же и в сумме 100", () => {
    const ranking = typeRanking(temperamentBlend, { a: 4, b: 4, c: 2 }, { resultId: "b" })!;
    expect(ranking.map((r) => r.percent)).toEqual([40, 40, 20]);
  });

  it("текст сообщения: подстановки {title} {emoji} {pct} {link}", () => {
    const test = testSchema.parse(temperamentJson);
    const choleric = test.results.find((r) => r.id === "choleric")!;
    expect(shareButtonLabel(test)).toBe("Показать состав 🧪");
    expect(shareMessage(test, choleric, { link: "https://x.ru/test/temperament?from=share", pct: 58 })).toBe(
      "Мой состав характера: Холерик 🔥 58%. А из чего ты? 👉 https://x.ru/test/temperament?from=share",
    );
  });

  it("нет баллов — «{pct}%» убирается целиком, без «… 🔥 %.»", () => {
    const test = testSchema.parse(temperamentJson);
    const choleric = test.results.find((r) => r.id === "choleric")!;
    expect(shareMessage(test, choleric, { link: "L" })).toBe("Мой состав характера: Холерик 🔥. А из чего ты? 👉 L");
  });

  it("при равных баллах проценты сверху вниз не растут", () => {
    // 10/4/4/4/2/0 из 24: трём равным достаются 17, 17, 16 — по порядку показа
    const pct = largestRemainderPercents([10, 4, 4, 4, 2, 0]);
    expect(pct).toEqual([42, 17, 17, 16, 8, 0]);
  });

  it("у теста по шкалам {scale} и {emoji} — самая высокая шкала", () => {
    const test = testSchema.parse(selfEsteemJson);
    const result = test.results[0]!;
    expect(shareMessage(test, result, { link: "L", topScale: { title: "Принятие себя", emoji: "💛" } })).toBe(
      "Моя опора: Принятие себя 💛 А на чём стоишь ты? 👉 L",
    );
  });

  it("без share у теста — «Пофлексить 🧊» и shareText результата со ссылкой", () => {
    const result = temperamentLike.results[0]!;
    expect(shareButtonLabel(temperamentLike)).toBe("Пофлексить 🧊");
    expect(shareMessage(temperamentLike, { ...result, shareText: "Я — a ✨" }, { link: "L" })).toBe("Я — a ✨ L");
    expect(shareMessage(temperamentLike, result, { link: "L" })).toBe("a ✨ L");
  });
});

describe("шеринг: ссылка на итог, превью и «ответка»", () => {
  const temperament = testSchema.parse(temperamentJson);
  const selfEsteem = testSchema.parse(selfEsteemJson);
  // меланхолик 12, холерик 11 (разрыв 1 ≤ maxGap 2) — смешанный «Меланхолик × Холерик»
  const mixed = { resultId: "melancholic", blendId: "choleric", scores: { choleric: 11, sanguine: 0, phlegmatic: 1, melancholic: 12 } };

  it("ссылка туда и обратно: баллы через точку в порядке results", () => {
    const q = sharedResultQuery(temperament, mixed);
    expect(q).toEqual({ r: "melancholic", b: "choleric", s: "11.0.1.12" });
    expect(parseSharedResult(temperament, q)).toEqual({ ...mixed, pct: 50 });
  });

  it("у теста по шкалам баллы — в порядке шкал, процента нет", () => {
    const q = sharedResultQuery(selfEsteem, { resultId: "almost", scores: { acceptance: 3, confidence: 10, independence: 8 } });
    expect(q).toEqual({ r: "almost", s: "3.10.8" });
    expect(parseSharedResult(selfEsteem, q)).toEqual({ resultId: "almost", scores: { acceptance: 3, confidence: 10, independence: 8 } });
  });

  it("битые и подделанные параметры — null (покажем обычное превью теста)", () => {
    const bad = [
      {},
      { r: "melancholic" }, // без баллов
      { r: "nope", s: "11.0.1.12" }, // нет такого результата
      { r: "melancholic", s: "11.0.1" }, // не все баллы
      { r: "melancholic", s: "11.0.1.12.5" }, // лишние
      { r: "melancholic", s: "11.0.x.12" }, // не число
      { r: "melancholic", s: "99.0.1.12" }, // больше максимума
      { r: "sanguine", s: "11.0.1.12" }, // результат не сходится с баллами
      { r: "melancholic", b: "melancholic", s: "11.0.1.12" }, // второй тип = первый
      { r: "melancholic", b: "phlegmatic", s: "11.0.1.12" }, // второй тип не тот
    ];
    for (const q of bad) expect(parseSharedResult(temperament, q), JSON.stringify(q)).toBeNull();
    expect(parseSharedResult(selfEsteem, { r: "solid", s: "3.10.8" })).toBeNull(); // сумма 21 — это «almost», не «solid»
  });

  it("заголовок и описание превью", () => {
    expect(sharedResultMeta(temperament, { ...mixed, pct: 50 })).toEqual({
      title: "Меланхолик 🌙 × Холерик 🔥 · GAZ",
      description: "Меланхолик 50%. А ты кто? Тест за 4 мин",
    });
    const plain = sharedResultMeta(selfEsteem, { resultId: "almost", scores: {} });
    expect(plain.title).toBe("Почти опора 🌤️ · GAZ");
    expect(plain.description).toBe("Почти опора. А ты кто? Тест за 4 мин");
  });

  it("текст «ответки»", () => {
    const [choleric, sanguine] = temperament.results;
    expect(answerBackMessage(choleric!, sanguine!, "L")).toBe("Я Холерик, ты Сангвиник. Ну что, похожи? 👉 L");
  });

  it("итог друга запоминается на устройстве", () => {
    const store = createProgressStore(createMemoryKeyValueStore());
    expect(store.getFriendResult("temperament")).toBeNull();
    store.saveFriendResult("temperament", { resultId: "sanguine", blendId: "choleric" }, new Date("2026-10-10"));
    store.saveTestResult("temperament", "choleric");
    expect(store.getFriendResult("temperament")).toMatchObject({ resultId: "sanguine", blendId: "choleric" });
    expect(store.getTestResult("temperament")?.resultId).toBe("choleric");
  });
});

describe("версии теста: «Языки любви» для парня и для девушки", () => {
  const love = testSchema.parse(loveLanguagesJson);
  const versions = love.audience!.options.map((o) => o.id);

  it("у теста две версии: Парень и Девушка", () => {
    expect(love.audience).toMatchObject({ title: "Кто проходит?" });
    expect(love.audience!.options.map((o) => o.label)).toEqual(["Парень", "Девушка"]);
  });

  it("в каждой версии 13 вопросов, ответов столько же и баллы те же, что у базы", () => {
    for (const v of versions) {
      const view = love.questions.map((q) => questionTexts(q, v));
      expect(view).toHaveLength(13);
      view.forEach((q, i) => {
        const base = love.questions[i]!;
        expect(q.options).toHaveLength(base.options.length);
        expect(q.text.length).toBeGreaterThan(0);
      });
    }
    // баллы считаются по базовым ответам — одинаковые ответы дают одинаковый итог в любой версии
    const answers = love.questions.map(() => 0);
    expect(scoreTest(love, answers)).toEqual(scoreTest(love, answers));
  });

  it("версия для парня подменяет тексты, где они есть; без версии — базовый текст", () => {
    const changed = love.questions.filter((q) => q.audience?.him);
    expect(changed.length).toBeGreaterThan(0);
    for (const q of changed) {
      const him = questionTexts(q, "him");
      const o = q.audience!.him!;
      if (o.text) expect(him.text).toBe(o.text);
      q.options.forEach((opt, i) => {
        if (opt.id && o.options?.[opt.id]) expect(him.options[i]).toBe(o.options[opt.id]);
        else expect(him.options[i]).toBe(opt.text);
      });
      expect(questionTexts(q, "her")).toEqual({ text: q.text, options: q.options.map((x) => x.text) });
      expect(questionTexts(q, null)).toEqual({ text: q.text, options: q.options.map((x) => x.text) });
    }
  });

  it("проверка версии и подпись над первым вопросом", () => {
    expect(isAudience(love, "him")).toBe(true);
    expect(isAudience(love, "nope")).toBe(false);
    expect(isAudience(love, null)).toBe(false);
    expect(audienceForLabel("Парень")).toBe("Для парня");
    expect(audienceForLabel("Девушка")).toBe("Для девушки");
  });

  it("выбор версии запоминается на устройстве", () => {
    const store = createProgressStore(createMemoryKeyValueStore());
    expect(store.getAudience("love-languages")).toBeNull();
    store.saveAudience("love-languages", "him");
    expect(store.getAudience("love-languages")).toBe("him");
  });
});

describe("шеринг: «костюмы» карточки", () => {
  const company = testSchema.parse(companyRoleJson);
  const temperament = testSchema.parse(temperamentJson);
  const selfEsteem = testSchema.parse(selfEsteemJson);
  const superpower = testSchema.parse(superpowerJson);
  const role = (id: string) => company.results.find((r) => r.id === id)!;

  it("дуэт и «опасно тусить»: другой результат или «ещё одна/ещё один» он же", () => {
    expect(partnerLabel(company, role("mom"), "duo")).toBe("Босс 👑");
    expect(partnerLabel(company, role("mom"), "danger")).toBe("ещё одна Мамочка 🍼");
    expect(partnerLabel(company, role("observer"), "danger")).toBe("ещё один Наблюдатель 🕶️");
    expect(partnerLabel(company, role("chaos"), "danger")).toBe("Юморист 😂"); // Мемолог переименован
    expect(partnerLabel(temperament, temperament.results[0]!, "duo")).toBeUndefined();
  });

  it("«Зови, когда: …» без двойного «когда»", () => {
    const spark = superpower.results.find((r) => r.id === "spark")!;
    expect(afterWhen(spark.howToLoveMe![0]!)).toBe("нужно раскачать скучную тусовку");
    expect(afterWhen("Говори прямо")).toBe("Говори прямо");
  });

  it("состав по убыванию и два первых результата с процентами", () => {
    const scores = { choleric: 4, sanguine: 9, phlegmatic: 1, melancholic: 10 };
    expect(ingredientsLine(temperament, scores)).toBe("меланхолик, сангвиник, холерик, флегматик");
    expect(ingredientsLine(temperament, {})).toBe("холерик, сангвиник, флегматик, меланхолик");
    const two = topTwo(temperament, scores, { resultId: "melancholic" });
    expect(two.map((r) => [r.result.id, r.percent])).toEqual([
      ["melancholic", 41],
      ["sanguine", 38], // 10/9/4/1 из 24: 42 + 38 + 17 + 4 = 101 — остаток от округления (−1) уходит главному типу
    ]);
  });

  it("опора самооценки: самая высокая шкала или ровный профиль", () => {
    expect(supportScale(selfEsteem, { acceptance: 3, confidence: 10, independence: 8 })).toEqual({ title: "Вера в свои силы", emoji: "💪" });
    expect(supportScale(selfEsteem, { acceptance: 6, confidence: 6, independence: 7 })).toBeNull();
    expect(supportScale(selfEsteem, {})).toBeUndefined();
  });

  it("номер чека — 4 цифры, один и тот же для одного итога", () => {
    expect(receiptNumber("love-languages/words/6.4.6.4.6")).toMatch(/^\d{4}$/);
    expect(receiptNumber("a")).toBe(receiptNumber("a"));
    expect(receiptNumber("a")).not.toBe(receiptNumber("b"));
  });
});

describe("список на экране результата (howToLoveMe)", () => {
  it("короткая подпись до двоеточия выделяется", () => {
    expect(splitListLabel("Тебе не хватает: Хаос 🌪️. Кто-то должен встряхнуть тебя.")).toEqual({
      label: "Тебе не хватает",
      text: "Хаос 🌪️. Кто-то должен встряхнуть тебя.",
    });
    expect(splitListLabel("Опасно тусить с: Мемолог 🤡.").label).toBe("Опасно тусить с");
    expect(splitListLabel("Идеальный дуэт: Босс 👑.").label).toBe("Идеальный дуэт");
  });

  it("двоеточие внутри обычной фразы — не подпись", () => {
    for (const item of [
      "В ссоре выбирай слова: они бьют сильнее, чем ты думаешь", // 4 слова
      "Не обижайся, если я задаю уточняющие вопросы: так я вникаю", // длинно и с запятой
      "Пиши мне без повода, просто так", // двоеточия нет
      "Время: ", // после двоеточия пусто
      ": начинается с двоеточия",
    ]) {
      expect(splitListLabel(item)).toEqual({ text: item });
    }
  });

  it("текст для копирования: заголовок, пункты с маркером и ссылка на тест", () => {
    expect(listCopyText({ heading: "Как меня любить", result: "⏳ Время вместе", items: ["Раз", "Два"] })).toBe(
      "Как меня любить (⏳ Время вместе):\n• Раз\n• Два",
    );
    expect(
      listCopyText({
        heading: "Твоя компания мечты",
        result: "🍼 Мамочка",
        items: ["Раз"],
        marker: "🧩",
        testUrl: "https://gaz.game/test/company-role",
      }),
    ).toBe("Твоя компания мечты (🍼 Мамочка):\n🧩 Раз\n\nПройди тест: https://gaz.game/test/company-role");
  });
});

describe("платные тесты под замком в каталоге", () => {
  const locked = { id: "dark", slug: "dark", title: "Т", emoji: "😈", description: "о", learn: ["п"], durationMin: 5, tags: [], tier: "premium" as const, locked: { reason: "subscription" as const, text: "💎" } };
  const catalog = { tests: [], games: [], lockedTests: [{ ...locked, sections: ["solo" as const] }, { ...locked, id: "pair", slug: "pair", sections: ["pairs" as const] }] };

  it("по разделу и по адресу; без поля lockedTests — пусто", () => {
    expect(lockedTestsForSection(catalog, "solo").map((t) => t.id)).toEqual(["dark"]);
    expect(lockedTestsForSection(catalog, "company")).toEqual([]);
    expect(findLockedTest(catalog, "pair")?.id).toBe("pair");
    expect(findLockedTest(catalog, "nope")).toBeUndefined();
    expect(lockedTestsForSection({ tests: [], games: [] }, "solo")).toEqual([]);
  });
});

describe("randomPool — из чего выбирает «Случайная игра»", () => {
  const draftTest = { ...temperamentLike, status: "draft" as const };
  const publishedGame = { ...truthOrDare, status: "published" as const };
  const adultGame = { ...whoInCompany, status: "published" as const, ageRating: "18+" as const };

  it("берёт только опубликованное, если оно есть (18+ без гейта — нет)", () => {
    const pool = randomPool({ tests: [draftTest], games: [publishedGame, adultGame] });
    expect(pool.map((i) => i.id)).toEqual([publishedGame.id]);
  });

  it("пока опубликованного нет — всё видимое, включая черновики", () => {
    const pool = randomPool({ tests: [draftTest], games: [{ ...truthOrDare, status: "draft" }] });
    expect(pool.map((i) => i.id).sort()).toEqual([draftTest.id, truthOrDare.id].sort());
  });

  it("черновики скрыты настройкой — их нет и в запасном варианте", () => {
    expect(randomPool({ tests: [draftTest], games: [] }, { includeDrafts: false })).toEqual([]);
  });
});

describe("«Мафия» — на настоящем mafia.json", () => {
  const mafia = gameSchema.parse(mafiaJson) as MafiaGame;
  const count = (cards: string[]) => cards.reduce<Record<string, number>>((acc, id) => ({ ...acc, [id]: (acc[id] ?? 0) + 1 }), {});

  it("состав по умолчанию — по числу игроков без ведущего", () => {
    expect(defaultLineup(mafia, 5)).toEqual({ mafia: 1, partygirl: 0, detective: 1, doctor: 1 });
    expect(defaultLineup(mafia, 6)).toEqual({ mafia: 1, partygirl: 1, detective: 1, doctor: 1 });
    expect(defaultLineup(mafia, 7)).toEqual({ mafia: 2, partygirl: 0, detective: 1, doctor: 1 });
    expect(defaultLineup(mafia, 9)).toEqual({ mafia: 2, partygirl: 1, detective: 1, doctor: 1 });
    expect(defaultLineup(mafia, 13).mafia).toBe(3);
    expect(defaultLineup(mafia, 20).mafia).toBe(4);
    // 5 игроков, один из них ведущий-карта → 4 без ведущего: такого в defaults нет, берём ближайший (5)
    expect(defaultLineup(mafia, 4)).toEqual(defaultLineup(mafia, 5));
    expect(defaultLineup(mafia, 25)).toEqual(defaultLineup(mafia, 20));
  });

  it("составы по умолчанию проходят проверку для любого числа игроков и ведущего", () => {
    for (let total = 5; total <= 20; total++) {
      for (const host of [0, 1]) {
        const check = checkLineup(mafia, total, host, defaultLineup(mafia, total - host));
        expect(check.ok, `${total} игроков, ведущий ${host}`).toBe(true);
      }
    }
  });

  it("мирные — остаток; ведущий не играет", () => {
    expect(checkLineup(mafia, 8, 0, defaultLineup(mafia, 8))).toMatchObject({ ok: true, civilians: 3, mafia: 2, others: 6 });
    expect(checkLineup(mafia, 8, 1, defaultLineup(mafia, 7))).toMatchObject({ ok: true, civilians: 3, mafia: 2, others: 5 });
  });

  it("проверка состава: ролей больше игроков, нет мафии, мафии слишком много", () => {
    expect(checkLineup(mafia, 5, 0, { mafia: 2, partygirl: 1, detective: 1, doctor: 2 })).toMatchObject({
      ok: false,
      problem: "too-many-roles",
      civilians: -1,
    });
    expect(checkLineup(mafia, 8, 0, { mafia: 0, partygirl: 1, detective: 1, doctor: 1 }).problem).toBe("no-mafia");
    expect(checkLineup(mafia, 6, 0, { mafia: 3, partygirl: 0, detective: 0, doctor: 0 }).problem).toBe("mafia-majority");
    // граница: 2 мафии против 3 остальных — можно, 3 против 3 — нельзя
    expect(checkLineup(mafia, 5, 0, { mafia: 2, partygirl: 0, detective: 0, doctor: 0 }).ok).toBe(true);
    expect(checkLineup(mafia, 6, 1, { mafia: 3, partygirl: 0, detective: 0, doctor: 0 }).problem).toBe("mafia-majority");
  });

  it("раздача: столько карт, сколько игроков, роли по составу, ведущий — если выбран", () => {
    const lineup = defaultLineup(mafia, 9);
    const cards = dealRoles(mafia, 10, 1, lineup, seededRandom(4));
    expect(cards).toHaveLength(10);
    expect(count(cards)).toEqual({ mafia: 2, partygirl: 1, detective: 1, doctor: 1, civilian: 4, host: 1 });
    expect(dealRoles(mafia, 10, 1, lineup, seededRandom(4))).toEqual(cards); // одно зерно — один порядок
    expect(count(dealRoles(mafia, 6, 0, defaultLineup(mafia, 6))).host).toBeUndefined();
    expect(() => dealRoles(mafia, 5, 0, { mafia: 0 })).toThrow();
  });

  it("автопобеда города: мафий не осталось", () => {
    let match = createMatch(dealRoles(mafia, 7, 0, defaultLineup(mafia, 7))); // 2 мафии, 5 остальных
    expect(aliveSides(mafia, match)).toEqual({ mafia: 2, city: 5 });
    match = eliminate(mafia, match, "mafia");
    expect(winner(mafia, match)).toBeNull();
    match = eliminate(mafia, match, "mafia");
    expect(winner(mafia, match)).toBe("city");
  });

  it("автопобеда мафии: мафий не меньше остальных живых; все роли кроме мафии — город", () => {
    let match = createMatch(dealRoles(mafia, 7, 0, defaultLineup(mafia, 7))); // 2 против 5
    for (const role of ["civilian", "detective"]) match = eliminate(mafia, match, role);
    expect(aliveSides(mafia, match)).toEqual({ mafia: 2, city: 3 });
    expect(winner(mafia, match)).toBeNull();
    match = eliminate(mafia, match, "doctor");
    expect(aliveSides(mafia, match)).toEqual({ mafia: 2, city: 2 });
    expect(winner(mafia, match)).toBe("mafia");
    // после победы больше никого не убираем; «Отменить последнее» возвращает игру
    expect(eliminate(mafia, match, "civilian")).toBe(match);
    match = undoElimination(match);
    expect(winner(mafia, match)).toBeNull();
    expect(match.eliminated).toEqual(["civilian", "detective"]);
  });

  it("ведущий не считается и не выбывает; нельзя убрать роль, которой не осталось", () => {
    const match = createMatch(dealRoles(mafia, 6, 1, defaultLineup(mafia, 5))); // ведущий + 1 мафия + 4
    expect(aliveSides(mafia, match)).toEqual({ mafia: 1, city: 4 });
    expect(eliminate(mafia, match, "host")).toBe(match);
    expect(eliminate(mafia, match, "partygirl")).toBe(match); // тусовщицы в составе на 5 нет
    expect(undoElimination(match)).toBe(match);
  });
});

describe("deck раундами — «Кто из нас?»", () => {
  it("без повторов между раундами, пока колода не кончится; потом — заново, без повторов внутри раунда", () => {
    const random = seededRandom(5);
    let used: number[] = [];
    const seen: number[] = [];
    for (let r = 0; r < 4; r++) {
      const round = pickRound(50, 12, used, random);
      expect(round.cards).toHaveLength(12);
      seen.push(...round.cards);
      used = round.used;
    }
    expect(new Set(seen).size).toBe(48); // 4 раунда по 12 — все разные
    const fifth = pickRound(50, 12, used, random);
    expect(new Set(fifth.cards).size).toBe(12);
    const leftovers = [...Array(50).keys()].filter((i) => !seen.includes(i));
    expect(fifth.cards).toEqual(expect.arrayContaining(leftovers)); // сначала доигрываем 2 оставшиеся
    expect(fifth.used).toHaveLength(10); // колода перемешана заново, 10 из неё уже сыграли
    const sixth = pickRound(50, 12, fifth.used, random);
    expect(sixth.cards.some((c) => fifth.used.includes(c))).toBe(false);
  });

  it("раунд не больше колоды; мусор в сохранённых номерах игнорируется", () => {
    expect(pickRound(5, 12, []).cards).toHaveLength(5);
    expect(pickRound(5, 3, [99, -1, 0]).cards).not.toContain(0);
  });

  it("правила → карточка → передай телефон → … → финал; «Ещё раунд» — без правил", () => {
    let state = createRoundState([4, 7, 9]);
    expect(state.phase).toBe("rules");
    expect(roundReducer(state, { type: "next" })).toBe(state); // с правил — только «start»
    state = roundReducer(state, { type: "start" });
    const phases: string[] = [];
    while (state.phase !== "finale") {
      phases.push(`${state.phase}:${state.index}`);
      state = roundReducer(state, { type: "next" });
    }
    expect(phases).toEqual(["card:0", "handoff:0", "card:1", "handoff:1", "card:2"]);
    expect(roundReducer(state, { type: "next" })).toBe(state);
    expect(roundReducer(state, { type: "newRound", cards: [1, 2] })).toEqual({ cards: [1, 2], index: 0, phase: "card" });
  });

  it("подсказка — случайная и не та же, что только что", () => {
    const hints = ["a", "b", "c"];
    for (let seed = 1; seed < 20; seed++) expect(pickHint(hints, "b", seededRandom(seed))).not.toBe("b");
    expect(pickHint(["один"], "один")).toBe("один");
    expect(pickHint([], null)).toBeNull();
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

describe("guess-partner — «Насколько ты меня знаешь»", () => {
  const deck = knowEachOther.decks[0]!;
  const start = (seed = 1, previous: number[] = []) =>
    createGuessPartnerState(["Маша", "Саша"], deck, { previous, random: seededRandom(seed) });

  /** Нажать вариант по его исходному номеру (на экране варианты перемешаны). */
  const answer = (state: GuessPartnerState, original: number) => {
    const shown = state.questions[state.question]!.order.indexOf(original);
    return guessPartnerReducer(state, { type: "answer", shown });
  };
  /** Сыграть раунд: ответы про себя и догадки — исходные номера вариантов. */
  const playRound = (state: GuessPartnerState, self: number[], guess: number[]) => {
    for (const o of self) state = answer(state, o);
    expect(state.phase).toBe("handoff");
    state = guessPartnerReducer(state, { type: "continue" });
    for (const o of guess) state = answer(state, o);
    return state;
  };

  it("pickQuestions: сначала карточки, которых не было в прошлой игре", () => {
    const picked = pickQuestions(5, 3, [0, 1], seededRandom(7));
    expect([...picked].sort()).toEqual([2, 3, 4]);
    const mixed = pickQuestions(5, 3, [0, 1, 2], seededRandom(7));
    expect(mixed).toHaveLength(3);
    expect(mixed).toEqual(expect.arrayContaining([3, 4]));
    expect(new Set(mixed).size).toBe(3);
    expect(pickQuestions(2, 10, [])).toHaveLength(2); // не больше, чем карточек
  });

  it("берёт questionsPerGame вопросов и перемешивает варианты", () => {
    const state = start();
    expect(state.questions).toHaveLength(3);
    for (const q of state.questions) expect([...q.order].sort()).toEqual([0, 1, 2]);
    // с другим зерном получается другой набор или порядок
    expect(JSON.stringify(start(2).questions)).not.toBe(JSON.stringify(state.questions));
  });

  it("про себя — selfText и selfOptions, угадывающий видит text с именем", () => {
    let state = createGuessPartnerState(["Маша", "Саша"], deck, { previous: [1, 2, 3, 4], random: seededRandom(3) });
    // первые 3 карточки: 0 (новая) + две из прошлых; найдём, где карточка 0
    const at = state.questions.findIndex((q) => q.card === 0);
    for (let i = 0; i < at; i++) state = answer(state, 0);
    const self = currentView(state, deck)!;
    expect(self.text).toBe("Что ты делаешь ночью?");
    expect([...self.options].sort()).toEqual(["Ем", "Листаю", "Сплю"]);
    for (let i = at; i < 3; i++) state = answer(state, 0);
    state = guessPartnerReducer(state, { type: "continue" });
    for (let i = 0; i < at; i++) state = answer(state, 0);
    const guess = currentView(state, deck)!;
    expect(guess.text).toBe("Что Маша делает ночью?");
    expect([...guess.options].sort()).toEqual(["Ест", "Листает", "Спит"]);
  });

  it("раунд 1 → выбор «меняемся или результат»; совпадение — по номеру варианта", () => {
    const state = playRound(start(), [0, 1, 2], [0, 1, 0]);
    expect(state.phase).toBe("between");
    const done = guessPartnerReducer(state, { type: "finish" });
    expect(done.phase).toBe("finished");
    const score = scoreGuessPartner(done);
    expect(score.rounds).toEqual([{ subject: 0, guesser: 1, matches: 2, total: 3, percent: 67 }]);
    expect(score.percent).toBe(67);
  });

  it("раунд 2: игроки меняются местами, вопросы те же; звание — по среднему", () => {
    let state = playRound(start(), [0, 1, 2], [0, 1, 2]); // Саша знает Машу на 100%
    const questions = state.questions;
    state = guessPartnerReducer(state, { type: "continue" });
    expect(state).toMatchObject({ round: 1, phase: "self", question: 0 });
    expect(state.questions).toBe(questions);
    state = playRound(state, [2, 2, 2], [2, 0, 0]); // Маша знает Сашу на 33%
    expect(state.phase).toBe("finished");
    const score = scoreGuessPartner(state);
    expect(score.rounds.map((r) => [r.subject, r.guesser, r.percent])).toEqual([
      [0, 1, 100],
      [1, 0, 33],
    ]);
    expect(score.percent).toBe(67);
    expect(rankFor(score.percent, knowEachOther.ranks).title).toBe("Ещё знакомитесь");
  });

  it("во втором раунде вопрос показывает имя второго игрока", () => {
    let state = playRound(start(), [0, 0, 0], [0, 0, 0]);
    state = guessPartnerReducer(state, { type: "continue" });
    for (let i = 0; i < 3; i++) state = answer(state, 0);
    state = guessPartnerReducer(state, { type: "continue" });
    expect(currentView(state, deck)!.text).toContain("Саша");
  });

  it("на паузах ответы не принимаются, лишние действия ничего не ломают", () => {
    let state = start();
    for (let i = 0; i < 3; i++) state = answer(state, 0);
    expect(state.phase).toBe("handoff");
    expect(guessPartnerReducer(state, { type: "answer", shown: 0 })).toBe(state);
    expect(guessPartnerReducer(state, { type: "finish" })).toBe(state);
    expect(guessPartnerReducer(start(), { type: "answer", shown: 99 }).question).toBe(0);
  });

  it("playedCards — набор этой игры, чтобы в следующей начать с других", () => {
    const state = start();
    expect(playedCards(state)).toEqual(state.questions.map((q) => q.card));
  });

  it("deckAccess: locked, подписка и следующий уровень", () => {
    const [, , deep, abyss] = knowEachOther.decks;
    expect(deckAccess(deck)).toEqual({ open: true });
    expect(deckAccess(deep!)).toEqual({ open: false, reason: "soon", text: "Скоро" });
    expect(deckAccess(abyss!)).toMatchObject({ open: false, reason: "subscription" });
    expect(deckAccess({ ...deck, tier: "premium" })).toMatchObject({ open: false, reason: "subscription" });
    expect(deckAccess({ ...deck, tier: "premium" }, { userTier: "premium" })).toEqual({ open: true });
    expect(nextDeck(knowEachOther, "basics")?.id).toBe("middle");
    expect(nextDeck(knowEachOther, "middle")?.id).toBe("deep");
    expect(nextDeck(knowEachOther, "abyss")).toBeUndefined();
  });

  it("unlockAfter: закрыта, пока не доиграли указанную колоду", () => {
    const middle = knowEachOther.decks[1]!;
    const decks = knowEachOther.decks;
    const basics = decks[0]!;
    expect(deckAccess(middle, { decks })).toEqual({ open: false, reason: "after", text: `Сначала пройдите ${basics.title} ${basics.emoji}` });
    expect(deckAccess(middle, { decks, completedDecks: ["deep"] }).open).toBe(false);
    expect(deckAccess(middle, { decks, completedDecks: ["basics"] })).toEqual({ open: true });
    // с Premium все уровни открыты сразу
    expect(deckAccess(middle, { decks, userTier: "premium" })).toEqual({ open: true });
  });

  it("новая игра в колоде не повторяет прошлый набор целиком; варианты и вопросы перемешаны", () => {
    const middle = knowEachOther.decks[1]!; // 6 карточек, по 4 за игру
    let previous: number[] = [];
    for (let seed = 1; seed <= 30; seed++) {
      const state = createGuessPartnerState(["Маша", "Саша"], middle, { previous, random: seededRandom(seed) });
      const cards = playedCards(state);
      expect(cards).toHaveLength(4);
      if (previous.length > 0) expect([...cards].sort()).not.toEqual([...previous].sort());
      // обе новые карточки (которых не было в прошлый раз) обязательно попадают в игру
      for (const fresh of [0, 1, 2, 3, 4, 5].filter((c) => previous.length > 0 && !previous.includes(c))) {
        expect(cards).toContain(fresh);
      }
      previous = cards;
    }
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
    expect(hasAccess("premium", "premium")).toBe(true);
    expect(hasAccess("premium", "free")).toBe(true);
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

  it("помнит имена игроков и прошлый набор карточек, не теряя остального", () => {
    const store = createProgressStore(createMemoryKeyValueStore());
    store.saveTestResult("temperament", "choleric");
    expect(store.getPlayers("know")).toBeNull();
    expect(store.getLastCards("know/basics")).toEqual([]);
    store.savePlayers("know", ["Маша", "Саша"]);
    store.saveLastCards("know/basics", ["Вопрос 1", "Вопрос 2"]);
    store.recordGamePlayed("know", { score: 60 });
    expect(store.getPlayers("know")).toEqual(["Маша", "Саша"]);
    expect(store.getLastCards("know/basics")).toEqual(["Вопрос 1", "Вопрос 2"]);
    expect(store.getTestResult("temperament")?.resultId).toBe("choleric");
    expect(store.getCompletedDecks("know")).toEqual([]);
    store.markDeckCompleted("know", "basics");
    store.markDeckCompleted("know", "basics"); // повтор не дублируется
    store.markDeckCompleted("know", "middle");
    expect(store.getCompletedDecks("know")).toEqual(["basics", "middle"]);
    expect(store.getCompletedDecks("other")).toEqual([]);
  });

  it("читает старые сохранения без новых полей", () => {
    const kv = createMemoryKeyValueStore();
    kv.setItem("gazgame:progress:v1", JSON.stringify({ version: 1, tests: { t: { resultId: "a", completedAt: "x" } }, games: {} }));
    const store = createProgressStore(kv);
    expect(store.getPlayers("know")).toBeNull();
    expect(store.getTestResult("t")?.resultId).toBe("a");
  });

  it("работает без хранилища (null)", () => {
    const store = createProgressStore(null);
    store.saveTestResult("x", "y");
    expect(store.getTestResult("x")?.resultId).toBe("y");
  });
});
