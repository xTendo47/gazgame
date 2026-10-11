import { describe, expect, it } from "vitest";
import { buildCatalog, generatePremiumCode, normalizePremiumCode, PREMIUM_CODE_ALPHABET, type RawContentFile } from "@gazgame/content";
import premiumJson from "@gazgame/content/data/premium.json";
import premiumCodesJson from "@gazgame/content/data/premium-codes.json";
import lockedTestsJson from "@gazgame/content/data/locked-tests.json";
import attachmentJson from "@gazgame/content/data/tests/attachment-style.json";
import knowJson from "@gazgame/content/data/games/know-each-other.json";
import matchJson from "@gazgame/content/data/games/match-us.json";
import whoJson from "@gazgame/content/data/games/who-of-us.json";
import neverJson from "@gazgame/content/data/games/never-have-i-ever.json";
import mafiaJson from "@gazgame/content/data/games/mafia.json";
import truthJson from "@gazgame/content/data/games/truth-or-dare.json";
import spyJson from "@gazgame/content/data/games/spy.json";
import {
  checkPremiumCode,
  createMemoryKeyValueStore,
  createProgressStore,
  deckAccess,
  premiumCodeHash,
  premiumRefExists,
  seededRandom,
  sha256Hex,
} from "../src/index";

/** Каталог из настоящих файлов, которые нужны Премиуму (related ведут на другие игры — их здесь не проверяем). */
const games = [knowJson, matchJson, whoJson, neverJson, mafiaJson, truthJson, spyJson];
const loadCatalog = () =>
  buildCatalog(
    [
      ...games.map((data, i): RawContentFile => ({ path: `g${i}.json`, kind: "game", data: { ...data, related: [] } })),
      { path: "attachment-style.json", kind: "test", data: { ...attachmentJson, related: [] } },
    ],
    {
      lockedTests: { path: "locked-tests.json", data: lockedTestsJson },
      premium: { path: "premium.json", data: premiumJson },
      premiumCodes: { path: "premium-codes.json", data: premiumCodesJson },
    },
  );

describe("Премиум — коды", () => {
  it("SHA-256 совпадает с эталоном (пусто, латиница, кириллица, эмодзи, длинные строки)", () => {
    const vectors: [string, string][] = [
      ["", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
      ["abc", "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"],
      ["abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq", "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1"],
      ["GAZ-7K2M", "6d241004ae5a5213e02f01cb27a78e5008a71d2ea618e4c8cbe0a26f08a5121a"],
      ["Привет 💎", "28a3b69b02553051a553f170e52f0a8f09bce6d5d01c14da8d32574dc0de4142"],
      ["x".repeat(55), "d5e285683cd4efc02d021a5c62014694958901005d6f71e89e0989fac77e4072"],
      ["z".repeat(200), "983a71da81783dfb18f7617e411156a9b2655f48a769a001b7f88d4dfee2cb7b"],
    ];
    for (const [text, hash] of vectors) expect(sha256Hex(text)).toBe(hash);
  });

  it("код вида GAZ-XXXX без похожих символов 0/O и 1/I", () => {
    expect(PREMIUM_CODE_ALPHABET).not.toMatch(/[01OI]/);
    const random = seededRandom(3);
    for (let i = 0; i < 200; i++) expect(generatePremiumCode(random)).toMatch(/^GAZ-[2-9A-HJ-NP-Z]{4}$/);
  });

  it("проверка: без пробелов и без разницы в регистре; неверный код не проходит", () => {
    const hashes = [premiumCodeHash("GAZ-7K2M")];
    expect(normalizePremiumCode(" gaz - 7k2m ")).toBe("GAZ-7K2M");
    expect(checkPremiumCode(" gaz-7k2m", hashes)).toBe(hashes[0]);
    expect(checkPremiumCode("GAZ 7K2M", hashes)).toBeNull(); // без дефиса — другой код
    expect(checkPremiumCode("GAZ-7K2N", hashes)).toBeNull();
    expect(checkPremiumCode("   ", hashes)).toBeNull();
  });

  it("в контенте 30+ хэшей кодов, без повторов", () => {
    const hashes = loadCatalog().premiumCodes ?? [];
    expect(hashes.length).toBeGreaterThanOrEqual(30);
    expect(new Set(hashes).size).toBe(hashes.length);
  });
});

describe("Премиум — что открывается", () => {
  const catalog = loadCatalog();
  const status = (sectionId: string) =>
    catalog.premium!.sections.find((s) => s.id === sectionId)!.items.map((i) => [i.label, premiumRefExists(catalog, i.ref) ? "💎" : "скоро"]);

  it("пункты шторок: 💎 — то, что есть в контенте, «скоро» — нет ref или не нашли (Правда или действие пока «скоро»)", () => {
    expect(status("pairs")).toEqual([
      ["Насколько знаешь: Бездна", "💎"],
      ["Совпадём?: Глубоко", "💎"],
      ["Правда или действие: Жарче", "скоро"],
      ["Совместимость пары", "💎"],
      ["36 вопросов", "скоро"],
    ]);
    expect(status("company")).toEqual([
      ["Кто из нас?: Без тормозов", "💎"],
      ["Я никогда не…: Без тормозов", "💎"],
      ["Правда или действие: Жёстко", "скоро"],
      ["Мафия: роли и темы", "💎"],
      ["Шпион: Кино, Сериалы, Знаменитости", "скоро"],
    ]);
    expect(status("solo")).toEqual([
      ["Глубина в каждом тесте", "💎"],
      ["Пазл личности", "скоро"],
      ["Новые тесты раньше всех", "💎"],
    ]);
  });

  it("с Премиумом открываются закрытые колоды с карточками; без Премиума — замки; пустые с Премиумом — «Скоро»", () => {
    const deck = (game: string, id: string) => {
      const g = catalog.games.find((x) => x.id === game);
      return g && g.mechanic !== "spy" && g.mechanic !== "mafia" ? g.decks.find((d) => d.id === id) : undefined;
    };
    for (const [game, id] of [
      ["know-each-other", "abyss"],
      ["who-of-us", "no-brakes"],
      ["never-have-i-ever", "no-brakes"],
      ["match-us", "deep"],
    ] as const) {
      const d = deck(game, id);
      expect(d, `${game}/${id}`).toBeDefined();
      expect(deckAccess(d!).open, `${game}/${id} без Премиума`).toBe(false);
      const withPremium = deckAccess(d!, { userTier: "premium" });
      if (d!.cards.length > 0) expect(withPremium.open, `${game}/${id} с Премиумом`).toBe(true);
      else expect(withPremium, `${game}/${id}: карточек ещё нет`).toEqual({ open: false, reason: "soon", text: "Скоро" });
    }
  });

  it("у платных тестов есть превью: зачем и минимум 2 вопроса", () => {
    for (const t of catalog.lockedTests ?? []) {
      expect(t.preview?.why, t.id).toBeTruthy();
      expect(t.preview?.questions.length, t.id).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("Премиум — на устройстве", () => {
  it("включается по хэшу и остаётся после перезапуска; «Хочу первым» считается один раз", () => {
    const kv = createMemoryKeyValueStore();
    const store = createProgressStore(kv);
    expect(store.isPremium()).toBe(false);
    store.activatePremium("abc");
    expect(createProgressStore(kv).isPremium()).toBe(true); // «перезагрузка страницы»
    expect(store.joinWaitlist()).toBe(true);
    expect(store.joinWaitlist()).toBe(false);
    expect(createProgressStore(kv).hasJoinedWaitlist()).toBe(true);
  });

  it("«Хочу первым» в Ultimate — отдельно от Премиума и тоже один раз", () => {
    const kv = createMemoryKeyValueStore();
    const store = createProgressStore(kv);
    expect(store.hasJoinedUltimateWaitlist()).toBe(false);
    expect(store.joinUltimateWaitlist()).toBe(true);
    expect(store.joinUltimateWaitlist()).toBe(false);
    expect(createProgressStore(kv).hasJoinedUltimateWaitlist()).toBe(true);
    expect(store.hasJoinedWaitlist()).toBe(false);
  });
});
