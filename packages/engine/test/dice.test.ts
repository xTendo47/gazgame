import { describe, expect, it } from "vitest";
import { buildCatalog, type RawContentFile } from "@gazgame/content";
import sectionsJson from "@gazgame/content/data/sections.json";
import lockedTestsJson from "@gazgame/content/data/locked-tests.json";
import cardGamesJson from "@gazgame/content/data/card-games.json";
import whoJson from "@gazgame/content/data/games/who-of-us.json";
import neverJson from "@gazgame/content/data/games/never-have-i-ever.json";
import mafiaJson from "@gazgame/content/data/games/mafia.json";
import spyJson from "@gazgame/content/data/games/spy.json";
import explainJson from "@gazgame/content/data/games/explain.json";
import knowJson from "@gazgame/content/data/games/know-each-other.json";
import matchJson from "@gazgame/content/data/games/match-us.json";
import truthJson from "@gazgame/content/data/games/truth-or-dare.json";
import superpowerJson from "@gazgame/content/data/tests/superpower.json";
import temperamentJson from "@gazgame/content/data/tests/temperament.json";
import thinkingJson from "@gazgame/content/data/tests/thinking-type.json";
import companyJson from "@gazgame/content/data/tests/company-role.json";
import selfJson from "@gazgame/content/data/tests/self-esteem.json";
import loveJson from "@gazgame/content/data/tests/love-languages.json";
import attachmentJson from "@gazgame/content/data/tests/attachment-style.json";
import { createMemoryKeyValueStore, createProgressStore, itemPath, pickDice, seededRandom, validDicePick, type DiceItem } from "../src/index";

const games = [whoJson, neverJson, mafiaJson, spyJson, explainJson, knowJson, matchJson, truthJson];
const tests = [superpowerJson, temperamentJson, thinkingJson, companyJson, selfJson, loveJson, attachmentJson];
const catalog = buildCatalog(
  [
    ...games.map((data, i): RawContentFile => ({ path: `g${i}.json`, kind: "game", data: { ...data, related: [] } })),
    ...tests.map((data, i): RawContentFile => ({ path: `t${i}.json`, kind: "test", data: { ...data, related: [] } })),
  ],
  {
    lockedTests: { path: "locked-tests.json", data: lockedTestsJson },
    cardGames: { path: "card-games.json", data: cardGamesJson },
    sectionLayouts: { path: "sections.json", data: sectionsJson },
  },
);
const config = catalog.sectionLayouts!.dice;
/** Готовые игры и тесты (без «Правды или действия»: она «скоро»). */
const items: DiceItem[] = [
  ...catalog.games.filter((g) => g.slug !== "truth-or-dare").map((g): DiceItem => ({ slug: g.slug, kind: "game", emoji: g.emoji, title: g.title, text: g.description, href: itemPath(g) })),
  ...catalog.tests.map((t): DiceItem => ({ slug: t.slug, kind: "test", emoji: t.emoji, title: t.title, text: t.description, href: itemPath(t) })),
];
const slugs = (size: string, mood: string) => {
  const found = new Set<string>();
  for (let seed = 0; seed < 200; seed++) found.add(pickDice(config, items, { size, mood }, seededRandom(seed))?.slug ?? "—");
  return [...found].sort();
};

describe("умный 🎲: «Сколько вас?» + «Какой настрой?»", () => {
  it("все слова из конфига — настоящие игры и тесты (опечаток нет)", () => {
    const known = new Set([...items.map((i) => i.slug), "*tests", "truth-or-dare"]);
    for (const list of [...config.sizes, ...config.moods]) for (const slug of list.items) expect(known.has(slug), slug).toBe(true);
  });

  it("пересечение людей и настроя: 5+ и «Поржать» — Кто из нас, Я никогда не, Объясни", () => {
    expect(slugs("many", "fun")).toEqual(["explain", "never-have-i-ever", "who-of-us"]);
    expect(slugs("many", "brain")).toEqual(["mafia", "spy"]);
    expect(slugs("few", "fun")).toEqual(["never-have-i-ever", "who-of-us"]);
    expect(slugs("duo", "talk")).toEqual(["know-each-other", "match-us"]);
    expect(slugs("solo", "brain")).toEqual(["thinking-type"]);
  });

  it("«Только я» — тесты; «Поговорить» для одного — любой тест", () => {
    const tests = items.filter((i) => i.kind === "test").map((i) => i.slug).sort();
    expect(slugs("solo", "talk")).toEqual(tests);
  });

  it("пустое пересечение — любая подходящая по людям (Вдвоём + Поржать → Совпадём? или Насколько знаешь)", () => {
    expect(slugs("duo", "fun")).toEqual(["know-each-other", "match-us"]);
    expect(slugs("many", "talk")).toEqual(["explain", "mafia", "never-have-i-ever", "spy", "who-of-us"]);
  });

  it("подряд одно и то же не выпадает, если есть из чего выбрать; нет подходящих — null", () => {
    let last: string | undefined;
    for (let seed = 0; seed < 50; seed++) {
      const r = pickDice(config, items, { size: "duo", mood: "talk" }, seededRandom(seed), last);
      expect(r?.slug).not.toBe(last);
      last = r?.slug;
    }
    expect(pickDice(config, [], { size: "duo", mood: "fun" })).toBeNull();
    expect(pickDice(config, items, { size: "нет", mood: "fun" })).toBeNull();
  });

  it("выбор запоминается на устройстве, битый выбор заменяется значениями по умолчанию", () => {
    const kv = createMemoryKeyValueStore();
    createProgressStore(kv).saveDicePick({ size: "many", mood: "brain" });
    expect(createProgressStore(kv).getDicePick()).toEqual({ size: "many", mood: "brain" });
    expect(validDicePick(config, { size: "many", mood: "x" }, config.default)).toEqual({ size: "many", mood: config.default.mood });
    expect(validDicePick(config, null, config.default)).toEqual(config.default);
  });
});
