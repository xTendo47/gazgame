import { describe, expect, it } from "vitest";
import { buildCatalog, type RawContentFile } from "@gazgame/content";
import sectionsJson from "@gazgame/content/data/sections.json";
import lockedTestsJson from "@gazgame/content/data/locked-tests.json";
import cardGamesJson from "@gazgame/content/data/card-games.json";
import knowJson from "@gazgame/content/data/games/know-each-other.json";
import matchJson from "@gazgame/content/data/games/match-us.json";
import whoJson from "@gazgame/content/data/games/who-of-us.json";
import neverJson from "@gazgame/content/data/games/never-have-i-ever.json";
import mafiaJson from "@gazgame/content/data/games/mafia.json";
import spyJson from "@gazgame/content/data/games/spy.json";
import truthJson from "@gazgame/content/data/games/truth-or-dare.json";
import temperamentJson from "@gazgame/content/data/tests/temperament.json";
import superpowerJson from "@gazgame/content/data/tests/superpower.json";
import thinkingJson from "@gazgame/content/data/tests/thinking-type.json";
import companyJson from "@gazgame/content/data/tests/company-role.json";
import selfEsteemJson from "@gazgame/content/data/tests/self-esteem.json";
import loveJson from "@gazgame/content/data/tests/love-languages.json";
import attachmentJson from "@gazgame/content/data/tests/attachment-style.json";
import { boldParts, createMemoryKeyValueStore, createProgressStore, peopleOption, sectionTarget, tooFewPeople } from "../src/index";

const games = [knowJson, matchJson, whoJson, neverJson, mafiaJson, spyJson, truthJson];
const tests = [temperamentJson, superpowerJson, thinkingJson, companyJson, selfEsteemJson, loveJson, attachmentJson];
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
const layouts = catalog.sectionLayouts!;
const section = (id: string) => layouts.sections.find((s) => s.id === id)!;
const item = (sectionId: string, title: string) => section(sectionId).tabs.flatMap((t) => t.items).find((i) => i.title === title)!;

describe("разделы в одном формате (sections.json)", () => {
  it("три раздела, в каждом три плитки: две бесплатные и третья Premium", () => {
    expect(layouts.sections.map((s) => s.id)).toEqual(["company", "solo", "pairs"]);
    for (const s of layouts.sections) expect(s.tabs.map((t) => t.premium === true)).toEqual([false, false, true]);
  });

  it("карточки ведут в существующие игры и тесты, «Карточные игры» — в /cards, платные тесты — в превью", () => {
    expect(sectionTarget(catalog, item("company", "Кто из нас?"))).toEqual({ kind: "link", href: "/game/who-of-us" });
    expect(sectionTarget(catalog, item("company", "Карточные игры"))).toEqual({ kind: "link", href: "/cards" });
    expect(sectionTarget(catalog, item("solo", "Темперамент"))).toEqual({ kind: "link", href: "/test/temperament" });
    expect(sectionTarget(catalog, item("solo", "Тёмная триада"))).toEqual({ kind: "locked-test", slug: "dark-triad" });
    expect(sectionTarget(catalog, item("pairs", "Совпадём?"))).toEqual({ kind: "link", href: "/game/match-us" });
  });

  it("«скоро» — если помечено или такого в контенте нет", () => {
    expect(sectionTarget(catalog, item("company", "Крокодил"))).toEqual({ kind: "soon" });
    expect(sectionTarget(catalog, item("company", "Правда или действие"))).toEqual({ kind: "soon" }); // помечено «скоро», хоть игра и есть
    expect(sectionTarget(catalog, { emoji: "🧪", title: "Нет такой", text: "-", ref: { game: "nope" } })).toEqual({ kind: "soon" });
  });

  it("каждая не-«скоро» карточка ведёт куда-то реальное", () => {
    for (const s of layouts.sections) {
      for (const it of s.tabs.flatMap((t) => t.items)) {
        if (!it.soon) expect(sectionTarget(catalog, it).kind, `${s.id}: ${it.title}`).not.toBe("soon");
      }
    }
  });

  it("«Сколько вас?»: по умолчанию 3–4; Мафия (от 5) бледнеет при 3–4 и доступна при 5–7", () => {
    const company = section("company");
    expect(peopleOption(company, null)?.label).toBe("3–4");
    expect(peopleOption(company, "nope")?.label).toBe("3–4");
    const mafia = item("company", "Мафия");
    expect(tooFewPeople(mafia, peopleOption(company, "3-4")?.max)).toBe(true);
    expect(tooFewPeople(mafia, peopleOption(company, "5-7")?.max)).toBe(false);
    expect(tooFewPeople(item("company", "Шпион"), peopleOption(company, "3-4")?.max)).toBe(false);
    expect(peopleOption(section("solo"), null)).toBeUndefined();
  });

  it("выбор «Сколько вас?» запоминается на устройстве", () => {
    const kv = createMemoryKeyValueStore();
    createProgressStore(kv).saveCompanySize("8+");
    expect(createProgressStore(kv).getCompanySize()).toBe("8+");
  });

  it("**жирный** в подписи", () => {
    expect(boldParts("Сверху выбираешь, **сколько вас**, и сразу")).toEqual([
      { text: "Сверху выбираешь, ", bold: false },
      { text: "сколько вас", bold: true },
      { text: ", и сразу", bold: false },
    ]);
  });
});
