import { describe, expect, it } from "vitest";
import { buildCatalog, quizBankWarnings } from "../src/index";
import { loadCatalog } from "../src/node";

const q = (id: string, level: number) => ({ id, level, text: "в", options: ["a", "b", "c", "d"], correct: 0 });
const artist = (slug: string, questions: unknown[]) => ({ name: slug, slug, questions });
const build = (artists: unknown[], quiz: unknown[] = []) =>
  buildCatalog([], {
    quiz: quiz.map((data, i) => ({ path: `quiz/${i}.json`, data })),
    quizArtists: artists.map((data, i) => ({ path: `quiz/artists/${i}.json`, data })),
  });

describe("Квиз $HOW: артисты (data/quiz/artists/*.json)", () => {
  it("в проекте 6 артистов: по 15 настоящих вопросов, 5 лёгких, 5 средних и 5 сложных, без draft", () => {
    const artists = loadCatalog().quizArtists ?? [];
    expect(artists.map((a) => a.slug).sort()).toEqual(["big-baby-tape", "friendly-thug-52-ngg", "kizaru", "madk1d", "og-buda", "pharaoh"]);
    for (const a of artists) {
      expect(a.questions).toHaveLength(15);
      for (const level of [1, 2, 3]) expect(a.questions.filter((x) => x.level === level)).toHaveLength(5);
      expect(a.questions.some((x) => x.draft === true)).toBe(false);
    }
  });

  it("звания: четыре порога 0 / 34 / 67 / 100 %, тексты из источника, без draft", () => {
    const ranks = (loadCatalog().quiz ?? []).find((f) => f.kind === "artist-ranks");
    expect(ranks?.kind === "artist-ranks" && ranks.ranks.map((r) => r.minPercent)).toEqual([0, 34, 67, 100]);
    expect(ranks?.kind === "artist-ranks" && ranks.ranks.map((r) => r.title)).toEqual([
      "Слышали пару треков в такси",
      "Шарите, но без фанатизма",
      "Знаете дискографию лучше лейбла",
      "Вы точно из одного подъезда",
    ]);
    expect(ranks?.kind === "artist-ranks" && ranks.ranks.some((r) => r.draft === true)).toBe(false);
  });

  it("по артистам предупреждений нет: в каждом уровне 5 вопросов без draft", () => {
    const catalog = loadCatalog();
    expect(quizBankWarnings(catalog.quiz, catalog.quizArtists)).toEqual([]);
  });

  it("нужны вопросы всех трёх уровней, slug и id вопросов не повторяются", () => {
    expect(() => build([artist("a", [q("a-1", 1), q("a-2", 2), q("a-3", 3)])])).not.toThrow();
    expect(() => build([artist("a", [q("a-1", 1), q("a-2", 1), q("a-3", 1)])])).toThrow(/нет вопроса уровня 2/);
    expect(() => build([artist("a", [q("a-1", 1), q("a-2", 2), q("a-3", 3)]), artist("a", [q("b-1", 1), q("b-2", 2), q("b-3", 3)])])).toThrow(/slug "a" повторяется/);
    expect(() => build([artist("a", [q("x", 1), q("a-2", 2), q("a-3", 3)]), artist("b", [q("x", 1), q("b-2", 2), q("b-3", 3)])])).toThrow(/уже есть в другом банке/);
  });

  it("поддерживает вопросы choice и input", () => {
    const input = { id: "a-i", level: 1, type: "input", text: "в", answers: ["а"], time: 30 };
    expect(() => build([artist("a", [input, q("a-2", 2), q("a-3", 3)])])).not.toThrow();
    expect(() => build([artist("a", [{ ...input, answers: [] }, q("a-2", 2), q("a-3", 3)])])).toThrow();
  });

  it("предупреждение, если у артиста меньше 5 вопросов без draft в уровне", () => {
    const catalog = build([artist("a", [q("a-1", 1), q("a-2", 2), q("a-3", 3)])]);
    expect(quizBankWarnings(undefined, catalog.quizArtists)).toHaveLength(3);
    const five = [1, 2, 3].flatMap((level) => Array.from({ length: 5 }, (_, i) => q(`a-${level}-${i}`, level)));
    expect(quizBankWarnings(undefined, build([artist("a", five)]).quizArtists)).toEqual([]);
  });
});
