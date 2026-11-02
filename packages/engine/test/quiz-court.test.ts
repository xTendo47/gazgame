import { describe, expect, it } from "vitest";
import { quizFileSchema, type QuizCourt } from "@gazgame/content";
import courtJson from "@gazgame/content/data/quiz/court.json";
import { courtVerdict, nextCourtSeen, pickCourtCase, type CourtCase } from "../src";

const court = quizFileSchema.parse(courtJson) as QuizCourt;
const mk = (n: number): CourtCase[] =>
  Array.from({ length: n }, (_, i) => ({ id: `c-${i}`, defendant: `П${i}`, source: "С", charge: "О", prosecution: "ПР", defense: "ЗА" }));

describe("квиз $HOW: суд присяжных", () => {
  it("в «Суде» 30 настоящих дел со всеми полями (подсудимый, откуда, обвинение, слово обвинению, слово защите)", () => {
    expect(court.cases).toHaveLength(30);
    for (const c of court.cases) {
      for (const field of [c.defendant, c.source, c.charge, c.prosecution, c.defense]) expect(field.trim()).not.toBe("");
      expect(c.draft).not.toBe(true);
    }
    expect(new Set(court.cases.map((c) => c.id)).size).toBe(30);
  });

  it("очко — за совпадение с большинством: в компании получают те, кто проголосовал как большинство", () => {
    const v = courtVerdict(["guilty", "guilty", "free", "guilty"]);
    expect(v.majority).toBe("guilty");
    expect(v).toMatchObject({ guilty: 3, free: 1 });
    expect(v.matched).toEqual([true, true, false, true]);
    expect(courtVerdict(["free", "free", "guilty"]).matched).toEqual([true, true, false]);
  });

  it("голоса поровну — ничья, очков нет", () => {
    const v = courtVerdict(["guilty", "free"]);
    expect(v.majority).toBe("tie");
    expect(v.matched).toEqual([false, false]);
    expect(courtVerdict(["guilty", "free", "guilty", "free"]).matched).toEqual([false, false, false, false]);
  });

  it("вдвоём очко получают оба, если проголосовали одинаково", () => {
    expect(courtVerdict(["free", "free"]).matched).toEqual([true, true]);
  });

  it("соло: без настоящих голосов большинства нет, с guiltyPercent — сравнение с ним", () => {
    expect(courtVerdict(["guilty"])).toMatchObject({ majority: "none", matched: [false] });
    expect(courtVerdict(["guilty"], 70)).toMatchObject({ majority: "guilty", matched: [true] });
    expect(courtVerdict(["guilty"], 30)).toMatchObject({ majority: "free", matched: [false] });
    expect(courtVerdict(["free"], 50).majority).toBe("tie");
  });

  it("дела берутся случайно, показанные не повторяются, пока не кончился круг; потом круг заново", () => {
    const cases = mk(5);
    let seen = new Set<string>();
    const shown: string[] = [];
    for (let i = 0; i < 5; i++) {
      const c = pickCourtCase(cases, seen) as CourtCase;
      shown.push(c.id);
      seen = nextCourtSeen(cases, c, seen);
    }
    expect(new Set(shown).size).toBe(5);
    // все показаны; следующее дело берётся из всех заново, отметки сбрасываются, остаётся только оно
    expect(seen.size).toBe(5);
    const again = pickCourtCase(cases, seen) as CourtCase;
    expect(cases.map((c) => c.id)).toContain(again.id);
    expect(nextCourtSeen(cases, again, seen).size).toBe(1);
    expect(pickCourtCase([], seen)).toBeUndefined();
  });

  it("на реальных 30 делах за 30 раундов все дела встречаются по разу", () => {
    let seen = new Set<string>();
    const ids: string[] = [];
    for (let i = 0; i < 30; i++) {
      const c = pickCourtCase(court.cases, seen) as CourtCase;
      ids.push(c.id);
      seen = nextCourtSeen(court.cases, c, seen);
    }
    expect(new Set(ids).size).toBe(30);
  });
});
