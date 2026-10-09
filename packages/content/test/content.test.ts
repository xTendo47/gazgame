import { describe, expect, it } from "vitest";
import { buildCatalog, ContentError, inspectContent } from "../src/index";
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
      upsell: { button: "Глубже", premium: { tier: "premium", text: "п" }, supreme: { tier: "supreme", text: "с" } },
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
