import { describe, expect, it } from "vitest";
import { gameSchema, type DeckGame } from "@gazgame/content";
import whoJson from "@gazgame/content/data/games/who-of-us.json";
import duoJson from "@gazgame/content/data/games/never-have-i-duo.json";
import { deckAccess } from "../src/index";

function load(json: unknown): DeckGame {
  const g = gameSchema.parse({ ...(json as object), related: [] });
  if (g.mechanic !== "deck") throw new Error("не колода");
  return g;
}
const who = load(whoJson);
const duo = load(duoJson);
const deck = (g: DeckGame, id: string) => g.decks.find((d) => d.id === id)!;
const texts = (g: DeckGame, id: string) => deck(g, id).cards.map((c) => c.text);

describe("«Кто из нас?»: колоды «Кто скорее… 🔮» и «Без тормозов 💎»", () => {
  it("колоды по порядку: С огоньком → Кто скорее… → Без тормозов", () => {
    expect(who.decks.map((d) => d.id)).toEqual(["spicy", "who-sooner", "no-brakes"]);
  });

  it("«Кто скорее…»: 40 карточек, бесплатно, 🔮, фиолетовый акцент, описание из спеки, upsell как у «С огоньком»", () => {
    const d = deck(who, "who-sooner");
    expect(d.cards).toHaveLength(40);
    expect(d.tier).toBe("free");
    expect(d.emoji).toBe("🔮");
    expect(d.title).toBe("Кто скорее…");
    expect(d.accent).toBe("violet");
    expect(d.description).toBe("Гадаем, что с кем из нас случится");
    expect(d.upsellText).toBe(deck(who, "spicy").upsellText);
    expect(d.cards[0]?.text).toBe("Кто скорее проспит свой же самолёт?");
    expect(d.cards[39]?.text).toBe("Кто скорее спасёт мир, если всё будет зависеть от нас?");
    expect(d.locked).toBeUndefined();
  });

  it("«Без тормозов 💎»: 35 карточек, Premium; без Premium замок, с Premium открыта", () => {
    const d = deck(who, "no-brakes");
    expect(d.cards).toHaveLength(35);
    expect(d.tier).toBe("premium");
    expect(d.cards[0]?.text).toBe("Кто из нас прочитает чужую переписку, если телефон оставили открытым?");
    expect(d.cards[34]?.text).toBe("Кто из нас жалуется на эту компанию в другой компании?");
    expect(deckAccess(d, { userTier: "free" }).open).toBe(false);
    expect(deckAccess(d, { userTier: "premium" }).open).toBe(true);
    expect(deckAccess(deck(who, "who-sooner"), { userTier: "free" }).open).toBe(true);
  });

  it("в карточках нет повторов и нет «сам / готов / был» (нейтральный род)", () => {
    for (const id of ["who-sooner", "no-brakes"]) {
      const all = texts(who, id);
      expect(new Set(all).size, id).toBe(all.length);
      for (const t of all) expect(t, `${id}: ${t}`).not.toMatch(/(^|[^а-яё])(сам|сама|готов|готова|был|была)(?=[^а-яё]|$)/i);
    }
  });

  it("подсказки желаний: три переписаны без рода («всем», «кого-то из компании», «произвели все»)", () => {
    const hints = who.finale?.hints ?? [];
    expect(hints).toHaveLength(20);
    expect(hints).toContain("Сделай комплимент всем в компании.");
    expect(hints).toContain("Изобрази кого-то из компании, остальные угадывают.");
    expect(hints).toContain("Расскажи, какое впечатление на тебя произвели все при первой встрече.");
    expect(hints.join(" ")).not.toMatch(/каждому в компании|любого из компании|произвёл каждый/);
  });
});

describe("«Я никогда не… вдвоём ✋»", () => {
  it("игра в Романтике на механике «Я никогда не…»: id, 2–2 игрока, раунд 12, кнопка «Рассказывай! 👀»", () => {
    expect(duo.id).toBe("never-have-i-duo");
    expect(duo.sections).toEqual(["pairs"]);
    expect(duo.players).toEqual({ min: 2, max: 2 });
    expect(duo.durationMin).toBe(15);
    expect(duo.emoji).toBe("✋");
    expect(duo.title).toBe("Я никогда не… вдвоём");
    expect(duo.description).toBe("Про вас двоих. Загибай палец, если было, врать нельзя 👀");
    expect(duo.roundSize).toBe(12);
    expect(duo.handoffText).toBe("Передай телефон 👉");
    expect(duo.cardButton).toBe("Рассказывай! 👀");
    expect(duo.rules).toHaveLength(6);
  });

  it("колоды: Про нас 40 / Признания 40 (бесплатно) / Каверзно 💎 30 (Premium, 16+, замок)", () => {
    expect(duo.decks.map((d) => [d.id, d.cards.length, d.tier, d.accent])).toEqual([
      ["together", 40, "free", "lime"],
      ["confess", 40, "free", "orange"],
      ["tricky", 30, "premium", "blue"],
    ]);
    const tricky = deck(duo, "tricky");
    expect(tricky.ageRating).toBe("16+");
    expect(tricky.locked).toEqual({ reason: "subscription", text: "По подписке 💎" });
    expect(tricky.finaleNote).toBe("Если что-то задело, это повод поговорить, а не поссориться 🤍");
    expect(deckAccess(tricky, { userTier: "free" }).open).toBe(false);
    expect(deckAccess(tricky, { userTier: "premium" }).open).toBe(true);
    expect(deckAccess(deck(duo, "confess"), { userTier: "free" }).open).toBe(true);
    expect(deck(duo, "together").upsellText).toBe("Разогрелись? Дальше Признания 🌶️");
    expect(deck(duo, "confess").upsellText).toBe("Готовы к неудобным вопросам? Каверзно 💎");
  });

  it("финал, подсказки для Ангела (12) и текст финала из спеки", () => {
    expect(duo.finale?.title).toBe("Считайте пальцы!");
    expect(duo.finale?.text).toBe("Больше загнуто: Тёмная лошадка 😏 Партнёр выбирает, про какой палец будет история. Меньше: Ангел 😇 Партнёр загадывает милое задание.");
    expect(duo.finale?.hintButton).toBe("Задание для Ангела 🎲");
    expect(duo.finale?.hints).toHaveLength(12);
    expect(duo.finale?.hints[0]).toBe("Обними на 20 секунд и не отпускай раньше.");
    expect(duo.finale?.hints[11]).toBe("Станцуйте медляк 30 секунд.");
  });

  it("все фразы начинаются с «я/мне/ты … никогда», без повторов; нейтральный род", () => {
    for (const d of duo.decks) {
      const all = d.cards.map((c) => c.text);
      expect(new Set(all).size, d.id).toBe(all.length);
      for (const t of all) {
        expect(t, `${d.id}: ${t}`).toMatch(/^(Я никогда|Мне никогда|Ты никогда)/);
        expect(t, `${d.id}: ${t}`).not.toMatch(/(^|[^а-яё])(сам|сама|готов|готова|был|была|рад|рада)(?=[^а-яё]|$)/i);
      }
    }
  });
});
