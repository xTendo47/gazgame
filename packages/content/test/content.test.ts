import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildCatalog, ContentError, findHiddenEmoji, inspectContent } from "../src/index";
import { loadCatalog } from "../src/node";

const validTest = {
  id: "demo",
  slug: "demo",
  kind: "test",
  title: "Демо",
  description: "Описание",
  emoji: "🧪",
  sections: ["solo"],
  players: { min: 1, max: 1 },
  durationMin: 1,
  questions: [{ text: "?", options: [{ text: "А", type: "a" }, { text: "Б", type: "b" }] }],
  results: [
    { id: "a", title: "А", emoji: "🅰️", text: "т", deepTeaser: { text: "д" } },
    { id: "b", title: "Б", emoji: "🅱️", text: "т", deepTeaser: { text: "д" } },
  ],
};

describe("контент в data/", () => {
  it("все файлы проходят проверку", () => {
    const catalog = loadCatalog();
    expect(catalog.tests.length).toBeGreaterThan(0);
    expect(catalog.games.length).toBeGreaterThan(0);
  });
});

describe("проверка ошибок", () => {
  it("подставляет значения по умолчанию", () => {
    const { tests } = buildCatalog([{ path: "demo.json", kind: "test", data: validTest }]);
    expect(tests[0]).toMatchObject({ tier: "free", status: "draft", ageRating: "all", related: [] });
  });

  it("новый формат: результат с paragraphs, scoring-объект, blendNotes и upsell", () => {
    const data = {
      ...structuredClone(validTest),
      scoring: { type: "types", types: ["a", "b"], tieBreak: { lastQuestions: ["q1"] }, blend: { maxGap: 1 } },
      questions: [{ id: "q1", text: "?", options: [{ text: "А", scores: { a: 2 } }, { text: "Б", scores: { b: 2 } }] }],
      results: [
        { id: "a", title: "А", emoji: "🅰️", paragraphs: ["п"], strengths: ["с"], watchOut: "в", tip: "с" },
        { id: "b", title: "Б", emoji: "🅱️", paragraphs: ["п"] },
      ],
      blendNotes: { a: { title: "с нотками А", text: "т" }, b: { title: "с нотками Б", text: "т" } },
      upsell: { button: "Глубже", premium: { tier: "premium", text: "п" } },
    };
    const { tests } = buildCatalog([{ path: "demo.json", kind: "test", data }]);
    expect(tests[0]?.upsell?.premium.primary).toBe(true);
  });

  it("ловит результат без text и paragraphs", () => {
    const broken = structuredClone(validTest) as { results: Record<string, unknown>[] };
    delete broken.results[0]!.text;
    expect(() => buildCatalog([{ path: "demo.json", kind: "test", data: broken }])).toThrow(/text или paragraphs/);
  });

  it("ловит tieBreak на несуществующий вопрос", () => {
    const broken = { ...structuredClone(validTest), scoring: { type: "types", tieBreak: { lastQuestions: ["q9"] } } };
    expect(() => buildCatalog([{ path: "demo.json", kind: "test", data: broken }])).toThrow(/нет вопроса с id "q9"/);
  });

  describe("подсчёт по шкалам (scales)", () => {
    const scalesTest = () => ({
      ...structuredClone(validTest),
      scoring: {
        type: "scales",
        scales: [{ id: "s", title: "Шкала", emoji: "📏", max: 3 }],
        totalMax: 3,
        scaleLevels: { low: [0, 1], high: [2, 3] },
      },
      questions: [{ scale: "s", text: "?", options: [{ text: "Да", score: 3 }, { text: "Нет", score: 0 }] }],
      results: [
        { id: "a", range: [0, 1], title: "А", emoji: "🅰️", paragraphs: ["п"] },
        { id: "b", range: [2, 3], title: "Б", emoji: "🅱️", paragraphs: ["п"], care: "з" },
      ],
      zones: { s: { low: "мало", high: "много" } },
    });
    const build = (data: unknown) => buildCatalog([{ path: "demo.json", kind: "test", data }]);

    it("правильный тест проходит, flatGap по умолчанию 0", () => {
      const scoring = build(scalesTest()).tests[0]?.scoring;
      expect(typeof scoring === "object" && scoring.type === "scales" && scoring.flatGap).toBe(0);
    });

    it("ловит вопрос без шкалы и вариант без score", () => {
      const noScale = scalesTest() as { questions: Record<string, unknown>[] };
      delete noScale.questions[0]!.scale;
      expect(() => build(noScale)).toThrow(/поле scale/);
      const noScore = scalesTest();
      noScore.questions[0]!.options[0] = { text: "Да", type: "a" } as never;
      expect(() => build(noScore)).toThrow(/должен быть score/);
    });

    it("ловит дыру в диапазонах результатов и неверный max шкалы", () => {
      const gap = scalesTest();
      gap.results[1]!.range = [3, 3];
      expect(() => build(gap)).toThrow(/число 2 не попадает/);
      const wrongMax = scalesTest();
      wrongMax.scoring.scales[0]!.max = 4;
      expect(() => build(wrongMax)).toThrow(/максимум 3, а указано 4/);
    });

    it("ловит зону с несуществующим уровнем", () => {
      const data = { ...scalesTest(), zones: { s: { low: "мало", top: "?" } } };
      expect(() => build(data)).toThrow(/нет уровня "top"/);
    });
  });

  it("ловит duo/danger на несуществующий результат", () => {
    const broken = structuredClone(validTest) as { results: Record<string, unknown>[] };
    broken.results[0]!.share = { line: "л", duo: "b", danger: "zzz" };
    expect(() => buildCatalog([{ path: "demo.json", kind: "test", data: broken }])).toThrow(/нет результата с id "zzz"/);
  });

  it("ловит ответ, ведущий к несуществующему результату", () => {
    const broken = structuredClone(validTest);
    broken.questions[0]!.options[0]!.type = "zzz";
    expect(() => buildCatalog([{ path: "demo.json", kind: "test", data: broken }])).toThrow(/нет результата с id "zzz"/);
  });

  it("ловит опечатку в названии поля", () => {
    const broken = { ...validTest, titel: "опечатка" };
    expect(() => buildCatalog([{ path: "demo.json", kind: "test", data: broken }])).toThrow(ContentError);
  });

  it("ловит related на несуществующий элемент", () => {
    const broken = { ...validTest, related: ["nope"] };
    expect(() => buildCatalog([{ path: "demo.json", kind: "test", data: broken }])).toThrow(/"nope"/);
  });

  it("ловит битый JSON", () => {
    expect(() => buildCatalog([{ path: "demo.json", kind: "test", data: undefined, parseError: "Unexpected token" }])).toThrow(
      /не читается как JSON/,
    );
  });
});

describe("отчёт для /dev/content", () => {
  it("показывает, в каком поле ошибка, и не падает", () => {
    const { files } = inspectContent([{ path: "demo.json", kind: "test", data: { ...validTest, durationMin: 0 } }]);
    expect(files[0]?.item).toBeUndefined();
    expect(files[0]?.issues.map((i) => i.field)).toContain("durationMin");
  });

  it("находит битые ссылки в related, но элемент остаётся в отчёте", () => {
    const { files, problems } = inspectContent([
      { path: "demo.json", kind: "test", data: { ...validTest, related: ["nope", "demo"] } },
    ]);
    expect(files[0]?.item?.id).toBe("demo");
    expect(files[0]?.brokenRelated).toEqual(["nope", "demo"]);
    expect(files[0]?.issues.map((i) => i.field)).toEqual(["related.0", "related.1"]);
    expect(problems).toHaveLength(2);
  });

  it("подсвечивает битые related, даже если файл не прошёл схему", () => {
    const { files } = inspectContent([
      { path: "demo.json", kind: "test", data: { ...validTest, durationMin: 0, related: ["nope"] } },
    ]);
    expect(files[0]?.item).toBeUndefined();
    expect(files[0]?.brokenRelated).toEqual(["nope"]);
  });

  it("отмечает повторяющийся id в обоих файлах", () => {
    const { files } = inspectContent([
      { path: "a.json", kind: "test", data: validTest },
      { path: "b.json", kind: "test", data: { ...validTest, slug: "demo-2" } },
    ]);
    expect(files.every((f) => f.issues.some((i) => i.field === "id"))).toBe(true);
  });
});

describe("игра guess-partner: уровни и вопросы «про себя»", () => {
  const card = { text: "Что {name} ест?", selfText: "Что ты ешь?", options: ["Суп", "Пиццу"], selfOptions: ["Суп", "Пиццу"] };
  const game = (decks: unknown[]) => ({
    id: "know",
    slug: "know",
    kind: "game",
    mechanic: "guess-partner",
    title: "Знаете друг друга?",
    description: "Описание",
    emoji: "💞",
    sections: ["pairs"],
    players: { min: 2, max: 2 },
    durationMin: 5,
    decks,
    ranks: [{ minPercent: 0, title: "Т", emoji: "🔍", text: "т" }],
  });
  const build = (data: unknown) => buildCatalog([{ path: "know.json", kind: "game", data }]);

  it("закрытая колода может быть без карточек, у открытой questionsPerGame", () => {
    const { games } = build(
      game([
        { id: "surface", title: "Поверхность", emoji: "🌊", questionsPerGame: 1, cards: [card] },
        { id: "abyss", title: "Бездна", emoji: "💎", tier: "premium", locked: { reason: "subscription", text: "По подписке" }, cards: [] },
      ]),
    );
    const know = games[0];
    expect(know && "decks" in know ? know.decks[1]?.locked?.reason : null).toBe("subscription");
  });

  it("unlockAfter должен указывать на другую колоду этой игры", () => {
    const surface = { id: "surface", title: "П", emoji: "🌊", cards: [card] };
    expect(() => build(game([surface, { id: "depth", title: "Г", emoji: "🐋", unlockAfter: "surface", cards: [card] }]))).not.toThrow();
    expect(() => build(game([surface, { id: "depth", title: "Г", emoji: "🐋", unlockAfter: "nope", cards: [card] }]))).toThrow(
      /нет колоды с id "nope"/,
    );
    expect(() => build(game([{ ...surface, unlockAfter: "surface" }]))).toThrow(/после самой себя/);
  });

  it("открытая колода без карточек — ошибка", () => {
    expect(() => build(game([{ id: "surface", title: "П", emoji: "🌊", cards: [] }]))).toThrow(/хотя бы одна карточка/);
  });

  it("selfOptions другой длины, чем options, — ошибка", () => {
    const bad = { ...card, selfOptions: ["Суп"], options: ["Суп", "Пиццу", "Салат"] };
    expect(() => build(game([{ id: "surface", title: "П", emoji: "🌊", cards: [bad] }]))).toThrow(/столько же вариантов/);
  });
});

describe("игра «Мафия» (mechanic: mafia)", () => {
  const mafiaFile = () =>
    JSON.parse(readFileSync(new URL("../data/games/mafia.json", import.meta.url), "utf-8")) as Record<string, unknown> & {
      roles: Record<string, unknown>[];
      defaults: { from: number; to: number; roles: Record<string, number> }[];
    };
  // related ведёт на другие игры, а в этом каталоге только «Мафия» — ссылки проверяем в тесте «все файлы в data/»
  const build = (data: unknown) => buildCatalog([{ path: "mafia.json", kind: "game", data: { ...(data as object), related: [] } }]);

  it("настоящий файл проходит, колоды не нужны", () => {
    const { games } = build(mafiaFile());
    expect(games[0]?.mechanic).toBe("mafia");
  });

  it("нужна ровно одна роль мирных с auto", () => {
    const data = mafiaFile();
    data.roles = data.roles.map((r) => ({ ...r, auto: undefined }));
    expect(() => build(data)).toThrow(/ровно одна роль с "auto": true/);
  });

  it("в defaults только настраиваемые роли и без дыр по числу игроков", () => {
    const unknown = mafiaFile();
    unknown.defaults[0]!.roles.civilian = 2;
    expect(() => build(unknown)).toThrow(/только роли без auto/);
    const gap = mafiaFile();
    gap.defaults[0]!.to = 4;
    expect(() => build(gap)).toThrow(/для 5 игроков нет состава/);
  });
});

describe("платные тесты под замком (locked-tests.json)", () => {
  const locked = (extra: Record<string, unknown> = {}) => ({
    id: "dark",
    slug: "dark",
    title: "Тёмная триада",
    emoji: "😈",
    description: "Описание",
    learn: ["Пункт"],
    durationMin: 5,
    sections: ["solo"],
    locked: { reason: "subscription", text: "По подписке 💎" },
    ...extra,
  });
  const build = (lockedTests: unknown[], tests = [validTest]) =>
    buildCatalog(
      tests.map((data, i) => ({ path: `t${i}.json`, kind: "test" as const, data })),
      { path: "locked-tests.json", data: { lockedTests } },
    );

  it("настоящий файл загружается вместе с каталогом", () => {
    const catalog = loadCatalog();
    expect(catalog.lockedTests?.map((t) => t.id)).toEqual(["dark-triad", "anxiety-level", "jung-archetype"]);
    expect(catalog.lockedTests?.find((t) => t.id === "anxiety-level")?.disclaimer).toBeTruthy();
  });

  it("подставляет tier premium и пустые tags", () => {
    expect(build([locked()]).lockedTests?.[0]).toMatchObject({ tier: "premium", tags: [] });
  });

  it("без файла — пусто, а не ошибка", () => {
    expect(buildCatalog([{ path: "t.json", kind: "test", data: validTest }]).lockedTests).toEqual([]);
  });

  it("ловит пустой «Что узнаешь», повтор и совпадение с обычным тестом", () => {
    expect(() => build([locked({ learn: [] })])).toThrow(/learn/);
    expect(() => build([locked(), locked()])).toThrow(/"dark" повторяется/);
    expect(() => build([locked({ id: "demo", slug: "other" })])).toThrow(/id "demo" уже есть/);
    expect(() => build([locked({ slug: "demo" })])).toThrow(/slug "demo" уже есть/);
  });
});

describe("версии теста (audience)", () => {
  const withAudience = (questionAudience: unknown) => ({
    ...structuredClone(validTest),
    audience: { title: "Кто проходит?", options: [{ id: "him", label: "Парень" }, { id: "her", label: "Девушка" }] },
    questions: [{ text: "?", audience: questionAudience, options: [{ id: "x", text: "А", type: "a" }, { id: "y", text: "Б", type: "b" }] }],
  });
  const build = (data: unknown) => buildCatalog([{ path: "demo.json", kind: "test", data }]);

  it("правильная подмена проходит", () => {
    expect(() => build(withAudience({ him: { text: "Вопрос для парня", options: { x: "Ответ А для парня" } } }))).not.toThrow();
  });

  it("ловит версию, которой нет у теста, и несуществующий id ответа", () => {
    expect(() => build(withAudience({ them: { text: "?" } }))).toThrow(/нет версии "them"/);
    expect(() => build(withAudience({ him: { options: { z: "?" } } }))).toThrow(/нет ответа с id "z"/);
  });
});

describe("эмодзи, которых не видно на Windows 10 и старых Android", () => {
  it("🥲 и 🫠 ловятся, 🔥 и 🧡 проходят", () => {
    expect(findHiddenEmoji({ a: "Я 🥲", b: ["ок", { c: "🫠 растаял" }] })).toEqual(["🥲", "🫠"]);
    expect(findHiddenEmoji({ a: "Холерик 🔥", b: "Человековед 🧡" })).toEqual([]);
  });

  it("новые сочетания ловятся, даже без невидимого селектора; старые части по отдельности — нет", () => {
    expect(findHiddenEmoji("Любовь ❤️‍🔥")).toEqual(["❤️‍🔥"]);
    expect(findHiddenEmoji("Выдох 😮\u200d💨")).toEqual(["😮‍💨"]);
    expect(findHiddenEmoji("❤️ и 🔥 отдельно, 😮 и 💨 тоже")).toEqual([]);
  });

  it("валидация падает с понятной ошибкой и именем файла", () => {
    const withEmoji = { ...structuredClone(validTest), emoji: "🫠" };
    expect(() => buildCatalog([{ path: "demo.json", kind: "test", data: withEmoji }])).toThrow(
      "demo.json: эмодзи 🫠 не видно на Windows 10 и старых Android, возьми другой",
    );
  });

  it("весь контент в data/ без таких эмодзи", () => {
    expect(() => loadCatalog()).not.toThrow();
  });
});
