import { describe, expect, it } from "vitest";
import { buildCatalog, type RawContentFile } from "@gazgame/content";
import sectionsJson from "@gazgame/content/data/sections.json";
import lockedTestsJson from "@gazgame/content/data/locked-tests.json";
import cardGamesJson from "@gazgame/content/data/card-games.json";
import knowJson from "@gazgame/content/data/games/know-each-other.json";
import matchJson from "@gazgame/content/data/games/match-us.json";
import matchFriendsJson from "@gazgame/content/data/games/match-friends.json";
import knowFriendJson from "@gazgame/content/data/games/know-friend.json";
import questionsJson from "@gazgame/content/data/games/36-questions.json";
import fiveSecondsJson from "@gazgame/content/data/games/five-seconds.json";
import coupleValuesJson from "@gazgame/content/data/tests/couple-values.json";
import introExtroJson from "@gazgame/content/data/tests/intro-extro.json";
import colorJson from "@gazgame/content/data/tests/color.json";
import vibeJson from "@gazgame/content/data/tests/vibe.json";
import cityJson from "@gazgame/content/data/tests/city.json";
import whoJson from "@gazgame/content/data/games/who-of-us.json";
import neverJson from "@gazgame/content/data/games/never-have-i-ever.json";
import mafiaJson from "@gazgame/content/data/games/mafia.json";
import spyJson from "@gazgame/content/data/games/spy.json";
import explainJson from "@gazgame/content/data/games/explain.json";
import neverDuoJson from "@gazgame/content/data/games/never-have-i-duo.json";
import truthJson from "@gazgame/content/data/games/truth-or-dare.json";
import temperamentJson from "@gazgame/content/data/tests/temperament.json";
import characterJson from "@gazgame/content/data/tests/character.json";
import jobJson from "@gazgame/content/data/tests/job.json";
import ageJson from "@gazgame/content/data/tests/age.json";
import animalJson from "@gazgame/content/data/tests/animal.json";
import signJson from "@gazgame/content/data/tests/sign.json";
import zombieJson from "@gazgame/content/data/tests/zombie.json";
import superpowerJson from "@gazgame/content/data/tests/superpower.json";
import thinkingJson from "@gazgame/content/data/tests/thinking-type.json";
import companyJson from "@gazgame/content/data/tests/company-role.json";
import selfEsteemJson from "@gazgame/content/data/tests/self-esteem.json";
import loveJson from "@gazgame/content/data/tests/love-languages.json";
import attachmentJson from "@gazgame/content/data/tests/attachment-style.json";
import jealousyJson from "@gazgame/content/data/tests/jealousy.json";
import romanceJson from "@gazgame/content/data/tests/romance-level.json";
import flagsJson from "@gazgame/content/data/tests/flags.json";
import loveNeedsJson from "@gazgame/content/data/tests/love-needs.json";
import breakupJson from "@gazgame/content/data/tests/breakup.json";
import { boldParts, itemPath, sectionGroups, sectionTarget, toggleKind } from "../src/index";

const games = [knowJson, matchJson, matchFriendsJson, knowFriendJson, questionsJson, fiveSecondsJson, whoJson, neverJson, neverDuoJson, mafiaJson, spyJson, explainJson, truthJson];
const tests = [characterJson, jobJson, ageJson, animalJson, signJson, zombieJson, temperamentJson, superpowerJson, thinkingJson, companyJson, selfEsteemJson, loveJson, attachmentJson, jealousyJson, romanceJson, flagsJson, loveNeedsJson, breakupJson, coupleValuesJson, introExtroJson, colorJson, vibeJson, cityJson];
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
    // «Объясни 🪧» — в «Банде в сборе», группа «На очки»
    expect(sectionTarget(catalog, item("company", "Объясни"))).toEqual({ kind: "link", href: "/game/explain" });
    expect(item("company", "Объясни").kind).toBe("points");
  });

  it("«скоро» — если помечено или такого в контенте нет", () => {
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

  it("Тусовка в новом шаблоне: Для своих / Банда в сборе / Без тормозов 💎, у бесплатных по 3 мини-кнопки, у Premium их нет", () => {
    const tabs = section("company").tabs;
    expect(section("company").title).toBe("Тусовка 🎉");
    expect(tabs.map((t) => [t.name, t.tag])).toEqual([
      ["Для своих", "2–3 человека"],
      ["Банда в сборе", "от 4"],
      ["Без тормозов", "Premium"],
    ]);
    expect(tabs[0]?.kinds?.map((k) => k.name)).toEqual(["На разогрев", "Узнать друг друга", "Угадайки"]);
    expect(tabs[1]?.kinds?.map((k) => k.name)).toEqual(["На разогрев", "С ролями", "На очки"]);
    expect(tabs[2]?.kinds).toBeUndefined();
    expect(tabs.map((t) => t.items.length)).toEqual([8, 7, 6]);
    expect(tabs[2]?.items.every((i) => i.premium)).toBe(true);
  });

  it("мини-кнопка «во что» оставляет одну группу, повторный тап возвращает все; номера карточек сохраняются", () => {
    const band = section("company").tabs[1]!;
    const all = sectionGroups(band, null)!;
    expect(all.map((g) => [g.name, g.items.length])).toEqual([["На разогрев", 3], ["С ролями", 2], ["На очки", 2]]);
    expect(all.reduce((n, g) => n + g.items.length, 0)).toBe(band.items.length);
    const roles = sectionGroups(band, "roles")!;
    expect(roles.map((g) => g.id)).toEqual(["roles"]);
    expect(roles[0]?.items.map((x) => x.item.title)).toEqual(["Шпион", "Мафия"]);
    expect(roles[0]?.items.map((x) => x.index)).toEqual([2, 3]); // по номеру считается, куда ведёт тап
    expect(sectionGroups(band, "нет-такой")!).toHaveLength(3);
    expect(toggleKind(null, "roles")).toBe("roles");
    expect(toggleKind("roles", "points")).toBe("points");
    expect(toggleKind("roles", "roles")).toBeNull();
    expect(sectionGroups(section("company").tabs[2]!, null)).toBeNull(); // Premium: без групп
  });

  it("Романтика: Игры / Близость / Совместимость 💎, кнопки и карточки по спеке", () => {
    const s = section("pairs");
    expect(s.title).toBe("Романтика 💞");
    expect(s.lead).toBe("Для себя всё бесплатно, разбор вас двоих в Premium");
    expect(s.tabs.map((t) => [t.name.replace("\u00AD", ""), t.tag])).toEqual([["Игры", "вдвоём"], ["Близость", "тесты и разговоры"], ["Совместимость", "Premium"]]);
    expect(s.tabs[0]?.kinds?.map((k) => k.name)).toEqual(["На разогрев", "Знаешь меня?", "Вдвоём вечером"]);
    expect(s.tabs[1]?.kinds?.map((k) => k.name)).toEqual(["Ты в любви", "Разговоры", "Чек пары"]);
    expect(s.tabs[2]?.kinds).toBeUndefined();
    expect(s.tabs.map((t) => t.items.length)).toEqual([6, 9, 5]);
    expect(s.tabs[2]?.note).toBe("Процент и одна строка бесплатно, чтобы второму захотелось пройти тест. Полный разбор вашей пары в Premium.");
    // чипы «Сравниться 💎» у тестов Близости и «Всегда бесплатно» у чека пары
    expect(item("pairs", "Тип привязанности").levels).toEqual([{ label: "Сравниться 💎", premium: true, compare: true }]);
    expect(item("pairs", "Здоровые ли у вас отношения?").levels).toEqual([{ label: "Всегда бесплатно", free: true }]);
    // ссылка «Сравниться с партнёром 💎» из результата ведёт на вкладку compat
    expect(s.tabs[2]?.id).toBe("compat");
  });

  it("Соло: Кто ты / Психо бесплатно / Глубже 💎; Тип привязанности в Соло не показываем", () => {
    const s = section("solo");
    expect(s.title).toBe("Соло 🧠");
    expect(s.lead).toBe("Всё про тебя. Для себя бесплатно");
    expect(s.tabs.map((t) => [t.name, t.tag])).toEqual([["Кто ты", "весёлые тесты"], ["Психо", "настоящая психология"], ["Глубже", "Premium"]]);
    expect(s.tabs[1]?.premium).toBeUndefined(); // Психо бесплатно
    expect(s.tabs[0]?.kinds?.map((k) => k.name)).toEqual(["Персонажи", "Дело и сила", "Вайб", "Город"]);
    expect(s.tabs[1]?.kinds?.map((k) => k.name)).toEqual(["Характер", "Любовь", "Состояние"]);
    const solo = s.tabs.flatMap((t) => t.items);
    expect(solo.some((i) => i.ref?.test === "attachment-style")).toBe(false);
    expect(solo.some((i) => i.title.includes("привязанности"))).toBe(false);
    expect(item("solo", "Как ты сейчас?").levels).toEqual([{ label: "Всегда бесплатно", free: true }]);
    expect(s.tabs[2]?.note).toBe("Сами тесты бесплатно. Здесь то, что глубже: сравнения и большие разборы.");
  });

  it("все тесты и игры доступны хотя бы из одного раздела (кроме заглушки «Правда или действие»)", () => {
    const refs = layouts.sections.flatMap((s) => s.tabs.flatMap((t) => t.items.flatMap((i) => (i.ref && !i.soon ? [i.ref] : []))));
    const reachable = new Set(refs.flatMap((r) => [r.game, r.test, r.lockedTest].filter((x): x is string => !!x)));
    const missing = [...catalog.games.map((g) => g.slug), ...catalog.tests.map((t) => t.slug), ...(catalog.lockedTests ?? []).map((t) => t.slug)].filter(
      (slug) => !reachable.has(slug),
    );
    // «Правда или действие» пока «скоро»: в игре черновые карточки-заглушки (как в спеке 16.10)
    expect(missing).toEqual(["truth-or-dare"]);
    expect(refs.some((r) => r.cards)).toBe(true); // «Карточные игры»
    expect(catalog.games.map((g) => itemPath(g))).toContain("/game/explain");
  });

  it("фильтра «Сколько вас?» на экранах разделов больше нет (вопрос остался только в шторке умного 🎲)", () => {
    expect(JSON.stringify(layouts.sections)).not.toMatch(/Сколько вас|"people"/);
    expect(JSON.stringify(layouts.texts)).not.toMatch(/fewPeople|needPeople/);
    expect(layouts.dice.askSize).toBe("Сколько вас?");
  });

  it("«Как играть за 10 секунд»: по три строки на каждую игру и тесты, тексты из спеки", () => {
    expect(Object.keys(layouts.rules).sort()).toEqual(["36-questions", "cards", "explain", "five-seconds", "know-each-other", "know-friend", "mafia", "match-friends", "match-us", "never-have-i-duo", "never-have-i-ever", "spy", "test", "truth-or-dare", "who-of-us"]);
    expect(layouts.rules.spy).toEqual(["Передаёте телефон по кругу, каждый тайно смотрит место.", "Одному выпадает «Ты шпион».", "Задаёте друг другу вопросы: город ищет шпиона, шпион угадывает место."]);
    expect(layouts.rules["never-have-i-ever"]?.[2]).toBe("Было? Загибай палец. Ноль пальцев = вылет.");
    expect(layouts.texts.rulesTitle).toBe("Как играть за 10 секунд");
    expect([layouts.texts.play, layouts.texts.later]).toEqual(["Играть →", "Не сейчас"]);
    // у каждой игры, которую можно открыть из раздела, правила есть
    for (const s of layouts.sections) {
      for (const it of s.tabs.flatMap((t) => t.items)) {
        if (it.soon || !it.ref) continue;
        const key = it.ref.game ?? (it.ref.cards ? "cards" : it.ref.test ? "test" : undefined);
        if (key) expect(layouts.rules[key], `${s.id}: ${it.title}`).toBeDefined();
      }
    }
  });

  it("всплывашки по тапу: 💎 и «скоро» дословно из спеки", () => {
    expect(layouts.texts.premiumHint).toBe("💎 Это Premium. Всё без 💎 бесплатно");
    expect(layouts.texts.compareHint).toBe("💎 Тест бесплатно. Сравнение с партнёром в Premium, процент бесплатно");
    expect(layouts.texts.soonToast).toBe("Скоро! Считаем, сколько людей ждут");
  });

  it("**жирный** в подписи", () => {
    expect(boldParts("Сверху выбираешь, **сколько вас**, и сразу")).toEqual([
      { text: "Сверху выбираешь, ", bold: false },
      { text: "сколько вас", bold: true },
      { text: ", и сразу", bold: false },
    ]);
  });
});
