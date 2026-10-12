import { describe, expect, it } from "vitest";
import { testSchema, type Test } from "@gazgame/content";
import temperamentJson from "@gazgame/content/data/tests/temperament.json";
import loveJson from "@gazgame/content/data/tests/love-languages.json";
import superpowerJson from "@gazgame/content/data/tests/superpower.json";
import thinkingJson from "@gazgame/content/data/tests/thinking-type.json";
import companyJson from "@gazgame/content/data/tests/company-role.json";
import attachmentJson from "@gazgame/content/data/tests/attachment-style.json";
import selfEsteemJson from "@gazgame/content/data/tests/self-esteem.json";
import { isTopTie, scoreTest, seededRandom, typeRanking } from "../src/index";

const typesTests: Test[] = [temperamentJson, loveJson, superpowerJson, thinkingJson, companyJson, attachmentJson].map((j) => testSchema.parse(j));
const allTests: Test[] = [...typesTests, testSchema.parse(selfEsteemJson)];

/** Ответы: на каждый вопрос — вариант, который даёт баллы нужному типу (по очереди из списка wants). */
function answersFor(test: Test, wants: string[]): number[] {
  return test.questions.map((q, i) => {
    const want = wants[i % wants.length]!;
    const idx = q.options.findIndex((o) => ((o.scores ?? {}) as Record<string, number>)[want]);
    return idx >= 0 ? idx : 0;
  });
}

describe("проценты и ничья в тестах типа types", () => {
  it("сумма процентов ровно 100 при любых ответах (1000 случайных прохождений каждого теста)", () => {
    const random = seededRandom(42);
    for (const test of typesTests) {
      for (let run = 0; run < 1000; run++) {
        const answers = test.questions.map((q) => Math.floor(random() * q.options.length));
        const score = scoreTest(test, answers);
        const ranking = typeRanking(test, score.scores, { resultId: score.resultId, blendId: score.blend?.resultId });
        expect(ranking, test.id).not.toBeNull();
        expect(ranking!.reduce((sum, r) => sum + r.percent, 0), test.id).toBe(100);
        // одинаковые баллы — одинаковые проценты (кроме ничьей наверху: там остаток уходит одному из нижних)
        for (let i = 1; i < ranking!.length && !isTopTie(ranking); i++) {
          if (ranking![i]!.score === ranking![i - 1]!.score) expect(ranking![i]!.percent).toBe(ranking![i - 1]!.percent);
        }
      }
    }
  });

  it("ничья 25/25 в «Типе мышления»: плашка «Ничья», второй тип показан, сумма 100", () => {
    const test = testSchema.parse(thinkingJson);
    // 3 ответа в Аналитика, 3 в Практика, остальные поровну на три других типа (как у Тимура): подбираем перебором
    const need: Record<string, number> = { analyst: 3, practical: 3, visionary: 2, human: 2, skeptic: 2 };
    const typeOf = (q: number, o: number) => Object.keys((test.questions[q]!.options[o]!.scores ?? {}) as Record<string, number>)[0]!;
    const answers: number[] = [];
    const solve = (q: number): boolean => {
      if (q === test.questions.length) return Object.values(need).every((n) => n === 0);
      for (let o = 0; o < test.questions[q]!.options.length; o++) {
        const t = typeOf(q, o);
        if (!need[t]) continue;
        need[t]--;
        answers[q] = o;
        if (solve(q + 1)) return true;
        need[t]++;
      }
      return false;
    };
    expect(solve(0)).toBe(true);
    const score = scoreTest(test, answers);
    expect(score.scores).toMatchObject({ analyst: 6, practical: 6 });
    const ranking = typeRanking(test, score.scores, { resultId: score.resultId, blendId: score.blend?.resultId })!;
    expect(ranking.slice(0, 2).map((r) => r.percent)).toEqual([25, 25]);
    expect(ranking.reduce((sum, r) => sum + r.percent, 0)).toBe(100);
    expect(isTopTie(ranking)).toBe(true);
    expect(score.blend?.resultId).toBe(ranking[1]!.result.id); // блок второго типа обязательно
  });

  it("при ничьей у всех тестов есть тексты второго типа (blendNotes) для любого результата", () => {
    for (const test of typesTests) for (const r of test.results) expect(test.blendNotes?.[r.id], `${test.id}/${r.id}`).toBeDefined();
  });

  it("без ничьей плашки нет", () => {
    const test = testSchema.parse(temperamentJson);
    const score = scoreTest(test, answersFor(test, ["choleric"]));
    expect(isTopTie(typeRanking(test, score.scores, { resultId: score.resultId }))).toBe(false);
  });
});

describe("тёплая строка ❤️ (heart)", () => {
  it("есть у каждого результата во всех тестах", () => {
    for (const test of allTests) for (const r of test.results) expect(r.heart, `${test.id}/${r.id}`).toBeTruthy();
  });

  it("строка Swag 😎 для шеринга есть у каждого результата; у «Типа привязанности» — та же, что share.line", () => {
    for (const test of allTests) for (const r of test.results) expect(r.swag, `${test.id}/${r.id}`).toBeTruthy();
    for (const r of testSchema.parse(attachmentJson).results) expect(r.swag).toBe(r.share?.line);
  });

  it("«Тип привязанности»: care переехал в heart, отдельного care нет; у «Строгого к себе» care остался", () => {
    const attachment = testSchema.parse(attachmentJson);
    for (const r of attachment.results) {
      expect(r.care).toBeUndefined();
      expect(r.heart).toBe("Тип привязанности не приговор. Он меняется с опытом и с людьми рядом.");
    }
    const strict = testSchema.parse(selfEsteemJson).results.find((r) => r.id === "strict");
    expect(strict?.care).toBeTruthy();
  });
});
