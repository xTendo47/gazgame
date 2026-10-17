import { describe, expect, it } from "vitest";
import { gameSchema } from "@gazgame/content";
import matchJson from "@gazgame/content/data/games/match-friends.json";
import knowJson from "@gazgame/content/data/games/know-friend.json";
import { deckAccess } from "../src/index";

const match = gameSchema.parse({ ...matchJson, related: [] });
const know = gameSchema.parse({ ...knowJson, related: [] });
if (match.mechanic !== "match" || know.mechanic !== "guess-partner") throw new Error("не те механики");

describe("«Совпадём? Друзья 👯»", () => {
  it("игра в Тусовке, 2 игрока, механика «Совпадём?»", () => {
    expect(match.id).toBe("match-friends");
    expect(match.sections).toEqual(["company"]);
    expect(match.players).toEqual({ min: 2, max: 2 });
    expect(match.emoji).toBe("👯");
    expect(match.description).toBe("Это или то: насколько вы похожи");
    expect(match.texts.flexText).toBe("Мы с {b} совпали на {pct}% в «Совпадём? Друзья» 👯 Проверьте себя 👉 {link}");
  });

  it("колоды: Лайт 30 / Дружба 30 (бесплатно) / Без фильтра 💎 20 (Premium), по 10 вопросов за игру", () => {
    expect(match.decks.map((d) => [d.id, d.cards.length, d.tier, d.questionsPerGame])).toEqual([
      ["light", 30, "free", 10],
      ["friendship", 30, "free", 10],
      ["no-filter", 20, "premium", 10],
    ]);
    expect(match.decks[0]?.upsellText).toBe("Разогрелись? Дальше Дружба 🤝");
    expect(match.decks[1]?.upsellText).toBe("Готовы к острому? Без фильтра 💎");
    const locked = match.decks[2]!;
    expect(deckAccess(locked, { userTier: "free" }).open).toBe(false);
    expect(deckAccess(locked, { userTier: "premium" }).open).toBe(true);
    expect(deckAccess(match.decks[1]!, { userTier: "free" }).open).toBe(true);
  });

  it("в каждой карточке два разных варианта, вопросы не повторяются", () => {
    for (const d of match.decks) {
      expect(new Set(d.cards.map((c) => c.text)).size, d.id).toBe(d.cards.length);
      for (const c of d.cards) {
        expect(c.options, c.text).toHaveLength(2);
        expect(c.options?.[0]).not.toBe(c.options?.[1]);
      }
    }
    expect(match.decks[0]?.cards[0]).toMatchObject({ text: "Тусить до утра или уйти в полночь?", options: ["До утра 🌅", "В полночь домой 🛏️"] });
  });

  it("5 рангов по проценту", () => {
    expect(match.ranks.map((r) => [r.minPercent, r.emoji, r.title])).toEqual([
      [91, "🧠", "Одна голова на двоих"],
      [71, "👯", "Близнецы по духу"],
      [51, "🤝", "Хороший дуэт"],
      [31, "⚡", "Искрит"],
      [0, "🧲", "Противоположности"],
    ]);
  });
});

describe("«Насколько ты знаешь друга 🤜»", () => {
  it("игра в Тусовке, 2 игрока, механика «Насколько ты меня знаешь»", () => {
    expect(know.id).toBe("know-friend");
    expect(know.sections).toEqual(["company"]);
    expect(know.emoji).toBe("🤜");
    expect(know.description).toBe("Один отвечает про себя, второй угадывает. Кто кого знает лучше?");
  });

  it("колоды: База 20 / Глубже 20 (бесплатно) / Без секретов 💎 16, вопросов за игру 8 / 10 / 12", () => {
    expect(know.decks.map((d) => [d.id, d.cards.length, d.tier, d.questionsPerGame])).toEqual([
      ["base", 20, "free", 8],
      ["deeper", 20, "free", 10],
      ["no-secrets", 16, "premium", 12],
    ]);
    expect(know.decks[0]?.upsellText).toBe("Это было легко. Дальше Глубже 🤿");
    expect(know.decks[1]?.upsellText).toBe("Совсем близко? Без секретов 💎");
    expect(deckAccess(know.decks[2]!, { userTier: "free" }).open).toBe(false);
    expect(deckAccess(know.decks[2]!, { userTier: "premium" }).open).toBe(true);
  });

  it("4 варианта в каждой карточке; selfText и selfOptions согласованы; {name} только в вопросе", () => {
    for (const d of know.decks) {
      for (const c of d.cards) {
        expect(c.options, c.text).toHaveLength(4);
        expect(c.text).toContain("{name}");
        expect(c.selfText).not.toContain("{name}");
        if (c.selfOptions) expect(c.selfOptions).toHaveLength(4);
      }
    }
    const first = know.decks[0]!.cards[0]!;
    expect(first.text).toBe("Чем {name} занимается в 3 часа ночи?");
    expect(first.selfText).toBe("Чем ты занимаешься в 3 часа ночи?");
    expect(first.selfOptions?.[0]).toBe("Листаю рилсы");
    // у варианта «Пиццу; Шаурму…» отдельных selfOptions нет: те же слова
    expect(know.decks[0]!.cards[1]!.selfOptions).toBeUndefined();
  });

  it("5 рангов по проценту", () => {
    expect(know.ranks.map((r) => [r.minPercent, r.title])).toEqual([
      [81, "Читаете мысли"],
      [61, "Лучшие друзья"],
      [41, "Хорошие друзья"],
      [21, "Есть что узнать"],
      [0, "Кто ты вообще?"],
    ]);
    expect(know.ranks[0]?.text).toBe("Вы знаете друг друга подозрительно хорошо. Проверьте себя в «Без секретов».");
  });
});
