import { describe, expect, it } from "vitest";
import { testSchema } from "@gazgame/content";
import attachmentJson from "@gazgame/content/data/tests/attachment-style.json";
import { scoreTest, seededRandom } from "../src/index";

const test = testSchema.parse(attachmentJson);

describe("«Тип привязанности» — на настоящем attachment-style.json", () => {
  it("12 вопросов, 4 итога, бесплатный, в «Для пар», костюм «Профиль в мессенджере»", () => {
    expect(test.questions).toHaveLength(12);
    expect(test.results.map((r) => r.id)).toEqual(["secure", "anxious", "avoidant", "fearful"]);
    expect(test.tier).toBe("free");
    expect(test.sections).toEqual(["pairs"]);
    expect(test.share?.style).toBe("messenger");
    expect(test.compat?.button).toBe("Сравниться с партнёром 💎");
    for (const r of test.results) {
      expect(r.share?.line).toMatch(/^Режим: /);
      expect(r.strengths?.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("баланс: на 10 000 случайных прохождений каждый итог выпадает в 20–30% случаев", () => {
    const random = seededRandom(2024);
    const counts: Record<string, number> = {};
    const runs = 10_000;
    for (let i = 0; i < runs; i++) {
      const answers = test.questions.map((q) => Math.floor(random() * q.options.length));
      const id = scoreTest(test, answers).result.id;
      counts[id] = (counts[id] ?? 0) + 1;
    }
    for (const r of test.results) {
      const share = (counts[r.id] ?? 0) / runs;
      expect(share, `${r.title}: ${(share * 100).toFixed(1)}%`).toBeGreaterThanOrEqual(0.2);
      expect(share, `${r.title}: ${(share * 100).toFixed(1)}%`).toBeLessThanOrEqual(0.3);
    }
  });
});
