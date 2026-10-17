import { describe, expect, it } from "vitest";
import { gazFileSchema, lockedTestsFileSchema, sectionsFileSchema, testSchema, todayFileSchema, type Catalog } from "@gazgame/content";
import gazJson from "@gazgame/content/data/gaz.json";
import lockedJson from "@gazgame/content/data/locked-tests.json";
import sectionsJson from "@gazgame/content/data/sections.json";
import todayJson from "@gazgame/content/data/today.json";
import test0 from "@gazgame/content/data/tests/attachment-style.json";
import test1 from "@gazgame/content/data/tests/company-role.json";
import test2 from "@gazgame/content/data/tests/love-languages.json";
import test3 from "@gazgame/content/data/tests/self-esteem.json";
import test4 from "@gazgame/content/data/tests/superpower.json";
import test5 from "@gazgame/content/data/tests/temperament.json";
import test6 from "@gazgame/content/data/tests/thinking-type.json";
import {
  addNewCard,
  buildCollection,
  collectionContent,
  countToday,
  createMemoryKeyValueStore,
  createProgressStore,
  dismissFlash,
  emptyCollection,
  emptyGaz,
  emptyToday,
  finishCard,
  gazTaskCard,
  markToday,
  openCardKey,
  streakCard,
  syncCollection,
  type CollectionContent,
  type TodayData,
} from "../src/index";

// Каталог собираем из настоящих файлов контента (engine не читает диск)
const catalog: Catalog = {
  tests: [test0, test1, test2, test3, test4, test5, test6].map((t) => testSchema.parse(t)),
  games: [],
  lockedTests: lockedTestsFileSchema.parse(lockedJson).lockedTests,
  gaz: gazFileSchema.parse(gazJson),
  today: todayFileSchema.parse(todayJson),
  sectionLayouts: sectionsFileSchema.parse(sectionsJson),
};
const content = collectionContent(catalog);
const ladder = catalog.today?.ladder ?? [];
/** 13.10.2026 12:00 МСК — вторник; day — число октября. */
const msk = (day: number, hour = 12) => new Date(Date.UTC(2026, 9, day, hour - 3));
const build = (progress: Parameters<typeof buildCollection>[1], now = msk(13)) => buildCollection(content, progress, now);

describe("контент Коллекции", () => {
  it("полка «Я»: тесты «Познай себя» по порядку из sections.json, потом остальные, потом платные", () => {
    expect(content.tests.map((t) => t.slug)).toEqual([
      "company-role",
      "superpower",
      "temperament",
      "thinking-type",
      "self-esteem",
      "love-languages",
      "attachment-style",
    ]);
    expect(content.locked.map((t) => t.slug)).toEqual(["dark-triad", "jung-archetype", "anxiety-level"]);
  });
});

describe("карты из того, что уже хранится", () => {
  it("пустая Коллекция: все слоты «???» и 💎, карт нет", () => {
    const v = build({ tests: {} });
    expect(v.total).toBe(0);
    expect(v.meTotal).toBe(10);
    expect(v.me.filter((s) => s.kind === "empty")).toHaveLength(7);
    expect(v.me.filter((s) => s.kind === "locked")).toHaveLength(3);
    expect(v.tasks).toEqual([]);
    expect(v.awards.every((s) => s.kind === "empty")).toBe(true);
    expect(v.awards.map((s) => (s.kind === "empty" ? s.label : ""))).toEqual(["3 дня подряд", "7 дней подряд", "30 дней подряд", "100 дней подряд"]);
  });

  it("итог теста становится картой; перепройденный тест обновляет карту", () => {
    const store = createProgressStore(createMemoryKeyValueStore());
    store.saveTestResult("superpower", "spark");
    let v = build(store.load());
    const card = v.me.find((s) => s.kind === "card");
    expect(card?.kind === "card" && card.card.title).toBe("Искра");
    expect(card?.kind === "card" && card.card.caption).toBe("Твоя суперсила");
    expect(card?.kind === "card" && card.card.rarity).toBe("common");
    expect(v.total).toBe(1);
    store.saveTestResult("superpower", "creator");
    v = build(store.load());
    expect(v.total).toBe(1); // карта одна, но уже другая
    const updated = v.me.find((s) => s.kind === "card");
    expect(updated?.kind === "card" && updated.card.title).toBe("Генератор");
  });

  it("ничья в тесте: на карте оба итога", () => {
    const store = createProgressStore(createMemoryKeyValueStore());
    store.saveTestResult("thinking-type", "analyst", new Date(), "visionary");
    const slot = build(store.load()).me.find((s) => s.kind === "card");
    expect(slot?.kind === "card" && slot.card.title).toBe("Аналитик + Визионер");
    expect(slot?.kind === "card" && slot.card.emoji2).toBeDefined();
    expect(slot?.kind === "card" && slot.card.share).toContain("r2=visionary");
  });

  it("сделанные задания GAZ: карты, новые первыми, повтор «×2», с усложнением золотая", () => {
    let gaz = emptyGaz();
    gaz = finishCard(gaz, "b01", false, msk(10));
    gaz = finishCard(gaz, "s-15-h-1", true, msk(11));
    gaz = finishCard(gaz, "b01", false, msk(12));
    const v = build({ tests: {}, gaz });
    expect(v.tasks.map((c) => c.key)).toEqual(["gaz:b01", "gaz:s-15-h-1"]);
    expect(v.tasks[0]?.count).toBe(2);
    expect(v.tasks[0]?.rarity).toBe("common");
    expect(v.tasks[0]?.caption).toBe("Задание GAZ · 12 окт");
    expect(v.tasks[1]?.rarity).toBe("gold");
    expect(v.total).toBe(2);
  });

  it("награда за 3 дня — обычная карта «Разогрев», за 7 — редкая «Неделя огня»; 30 и 100 — пустые слоты", () => {
    let today: TodayData = emptyToday();
    for (let d = 13; d < 16; d++) today = countToday(today, msk(d), ladder).data;
    let v = build({ tests: {}, today }, msk(15));
    expect(v.awards[0]).toMatchObject({ kind: "card", card: { title: "Разогрев", rarity: "common", caption: "Награда · 3 дня" } });
    expect(v.awardsOwned).toBe(1);
    expect(v.awardsTotal).toBe(4);
    for (let d = 16; d < 20; d++) today = countToday(today, msk(d), ladder).data;
    v = build({ tests: {}, today }, msk(19));
    expect(v.awards.slice(0, 2).map((s) => (s.kind === "card" ? s.card.rarity : ""))).toEqual(["common", "rare"]);
    expect(v.best).toBe(7);
  });

  it("челлендж недели: 5–6 отметок редкая карта, 7 золотая; идёт в зачёт, когда неделя закончилась (7 из 7 — сразу)", () => {
    const mark = (days: number[]) => {
      let gaz = emptyGaz();
      for (const d of days) gaz = markToday(gaz, msk(12 + d - 1)); // 12.10 — понедельник
      return gaz;
    };
    // неделя с 12.10: 5 отметок, смотрим в среду следующей недели
    const five = build({ tests: {}, gaz: mark([1, 2, 3, 4, 5]) }, msk(21));
    expect(five.awards[0]).toMatchObject({ kind: "card", card: { rarity: "rare" } });
    expect(five.awards[0]?.kind === "card" && five.awards[0].card.caption).toBe("Челлендж · 5 из 7");
    // та же неделя ещё идёт — карты нет
    expect(build({ tests: {}, gaz: mark([1, 2, 3, 4, 5]) }, msk(16)).awardsOwned).toBe(0);
    // 7 из 7: золотая сразу, в воскресенье
    const seven = build({ tests: {}, gaz: mark([1, 2, 3, 4, 5, 6, 7]) }, msk(18));
    expect(seven.awards[0]).toMatchObject({ kind: "card", card: { rarity: "gold" } });
    // 4 отметки — карты нет и через неделю
    expect(build({ tests: {}, gaz: mark([1, 2, 3, 4]) }, msk(21)).awardsOwned).toBe(0);
  });

  it("игры и «Как ты сейчас?» карт не дают: в записях прогресса игры не участвуют", () => {
    const store = createProgressStore(createMemoryKeyValueStore());
    store.recordGamePlayed("spy");
    expect(build(store.load()).total).toBe(0);
  });
});

describe("новые карты и вспышки", () => {
  const task = { id: "b01", emoji: "🖼️", text: "Задание" };

  it("первое открытие: всё собранное раньше известно и не считается новым", () => {
    const synced = syncCollection(emptyCollection(), [gazTaskCard(task, { count: 1, gold: false, date: "2026-10-12" })]);
    expect(synced.known).toEqual(["gaz:b01"]);
    expect(synced.newKeys).toEqual([]);
    expect(synced.flash).toEqual([]);
  });

  it("новая карта: точка, вспышка; открыл — точка гаснет; вспышку закрыли — очередь пуста", () => {
    const card = gazTaskCard(task, { count: 1, gold: false, date: "2026-10-12" });
    let d = addNewCard({ ...emptyCollection(), known: [] }, card);
    expect(d.newKeys).toEqual(["gaz:b01"]);
    expect(d.flash.map((f) => f.key)).toEqual(["gaz:b01"]);
    d = addNewCard(d, card); // та же карта — вспышка одна
    expect(d.flash).toHaveLength(1);
    d = dismissFlash(d);
    expect(d.flash).toEqual([]);
    expect(d.newKeys).toEqual(["gaz:b01"]); // точка горит, пока карту не открыли
    expect(openCardKey(d, "gaz:b01").newKeys).toEqual([]);
  });

  it("позже появившаяся карта (челлендж закончившейся недели) становится новой, известная — нет", () => {
    const known = gazTaskCard(task, { count: 1, gold: false, date: "2026-10-12" });
    const step = ladder[0];
    const award = step ? streakCard(step) : null;
    if (!award) throw new Error("нет карты за серию");
    const d0 = { ...emptyCollection(), known: [known.key] };
    expect(syncCollection(d0, [known])).toBe(d0);
    const d1 = syncCollection(d0, [known, award]);
    expect(d1.newKeys).toEqual(["award:streak-3"]);
    expect(d1.flash[0]?.title).toBe("Разогрев");
  });

  it("всё переживает «перезагрузку» (хранилище)", () => {
    const kv = createMemoryKeyValueStore();
    const card = gazTaskCard(task, { count: 1, gold: false, date: "2026-10-12" });
    createProgressStore(kv).updateCollection((d) => addNewCard(d, card));
    const d = createProgressStore(kv).getCollection();
    expect(d.newKeys).toEqual(["gaz:b01"]);
    expect(d.flash[0]?.share).toBe("k=gaz&id=b01&g=0");
  });
});

describe("контент для экрана легче каталога", () => {
  it("в нём нет текстов вопросов и разборов", () => {
    const json = JSON.stringify(content satisfies CollectionContent);
    expect(json.length).toBeLessThan(25_000);
  });
});
