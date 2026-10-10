import { describe, expect, it } from "vitest";
import { gameSchema, type DeckGame } from "@gazgame/content";
import neverJson from "@gazgame/content/data/games/never-have-i-ever.json";
import thinkingJson from "@gazgame/content/data/tests/thinking-type.json";
import { deckAccess, pickRound, seededRandom } from "../src/index";

const never = gameSchema.parse(neverJson) as DeckGame;

describe("«Я никогда не…» — на настоящем never-have-i-ever.json", () => {
  it("игра раундами по 12, как «Кто из нас?», с кнопкой «Рассказывай! 👀»", () => {
    expect(never.mechanic).toBe("deck");
    expect(never.roundSize).toBe(12);
    expect(never.handoffText).toBeTruthy();
    expect(never.finale?.hints.length).toBeGreaterThan(0);
    expect(never.cardButton).toBe("Рассказывай! 👀");
  });

  it("три колоды: Разминка и С перчинкой бесплатно, Без тормозов под замком; у каждой свой цвет", () => {
    expect(never.decks.map((d) => [d.id, d.cards.length, d.accent])).toEqual([
      ["warmup", 40, "lime"],
      ["spicy", 40, "orange"],
      ["no-brakes", 30, "blue"],
    ]);
    const [warmup, spicy, noBrakes] = never.decks;
    expect(deckAccess(warmup!).open).toBe(true);
    expect(deckAccess(spicy!).open).toBe(true);
    expect(deckAccess(noBrakes!)).toMatchObject({ open: false, reason: "subscription" });
  });

  it("в бесплатных колодах раунды по 12 без повторов, пока колода не кончится", () => {
    for (const deck of never.decks.slice(0, 2)) {
      const random = seededRandom(3);
      let used: number[] = [];
      const seen: number[] = [];
      for (let r = 0; r < 3; r++) {
        const round = pickRound(deck.cards.length, never.roundSize!, used, random);
        expect(round.cards).toHaveLength(12);
        seen.push(...round.cards);
        used = round.used;
      }
      expect(new Set(seen).size).toBe(36);
    }
  });
});

describe("«Тип мышления»: смайлик Скептика", () => {
  it("🤨 вместо 🧐 везде", () => {
    const raw = JSON.stringify(thinkingJson);
    expect(raw).not.toContain("🧐");
    expect(raw).toContain("Скептик 🤨");
  });
});
