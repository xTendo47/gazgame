import { describe, expect, it } from "vitest";
import { createMemoryKeyValueStore, createProgressStore, pickContinue, resumeAnswers, type ContinueGame, type ContinueTest } from "../src/index";

const make = (id: string, questions: number): ContinueTest => ({
  id,
  slug: id,
  title: `Тест ${id}`,
  emoji: "🧪",
  questions: Array.from({ length: questions }, () => ({ options: [1, 2, 3] })),
});
const a = make("a", 12);
const b = make("b", 5);

describe("«Продолжить»: незаконченный тест", () => {
  it("ответы сохраняются и переживают «перезагрузку»; дошёл до итога — запись удалена", () => {
    const kv = createMemoryKeyValueStore();
    const first = createProgressStore(kv);
    first.saveTestProgress("a", [0, 1, 2]);
    expect(createProgressStore(kv).getTestProgress("a")?.answers).toEqual([0, 1, 2]);
    first.clearTestProgress("a");
    expect(createProgressStore(kv).getTestProgress("a")).toBeNull();
    first.saveTestProgress("b", [1]);
    first.saveTestProgress("b", []); // вернулись к первому вопросу — записи нет
    expect(createProgressStore(kv).listTestProgress()).toEqual({});
  });

  it("берётся самый недавний; номер вопроса = ответов + 1", () => {
    const store = createProgressStore(createMemoryKeyValueStore());
    store.saveTestProgress("a", [0, 0, 0, 0, 0, 0], new Date("2026-10-17T10:00:00Z"));
    store.saveTestProgress("b", [1, 1], new Date("2026-10-17T11:00:00Z"));
    expect(pickContinue([a, b], store.listTestProgress())).toMatchObject({ test: { id: "b" }, question: 3, total: 5 });
    store.saveTestProgress("a", [0, 0, 0, 0, 0, 0, 2], new Date("2026-10-17T12:00:00Z"));
    expect(pickContinue([a, b], store.listTestProgress())).toMatchObject({ test: { id: "a" }, question: 8, total: 12 });
  });

  it("игра, которую открыли и не доиграли, тоже в «Продолжить»: самая свежая из теста и игры; через 12 часов пропадает", () => {
    const spy: ContinueGame = { id: "spy", slug: "spy", title: "Шпион", emoji: "🕵️" };
    const store = createProgressStore(createMemoryKeyValueStore());
    store.saveTestProgress("a", [0, 0], new Date("2026-10-17T10:00:00Z"));
    store.markGameStarted("spy", new Date("2026-10-17T11:00:00Z"));
    const now = new Date("2026-10-17T12:00:00Z");
    expect(pickContinue([a], store.listTestProgress(), [spy], store.listGameStarted(), now)).toMatchObject({ kind: "game", game: { id: "spy" } });
    store.saveTestProgress("a", [0, 0, 1], new Date("2026-10-17T11:30:00Z"));
    expect(pickContinue([a], store.listTestProgress(), [spy], store.listGameStarted(), now)).toMatchObject({ kind: "test", question: 4 });
    // игру доиграли: отметка снята
    store.recordGamePlayed("spy");
    expect(store.listGameStarted()).toEqual({});
    store.markGameStarted("spy", new Date("2026-10-17T00:00:00Z"));
    expect(pickContinue([], {}, [spy], store.listGameStarted(), new Date("2026-10-17T11:59:00Z"))).toMatchObject({ kind: "game" }); // прошло 11 ч 59 мин — ещё в карточке
    expect(pickContinue([], {}, [spy], store.listGameStarted(), new Date("2026-10-17T13:00:00Z"))).toBeNull();
    expect(pickContinue([], {}, [spy], store.listGameStarted(), new Date("2026-10-17T05:00:00Z"))).toMatchObject({ kind: "game" });
  });

  it("всплывашки при первом заходе показываем один раз", () => {
    const kv = createMemoryKeyValueStore();
    const store = createProgressStore(kv);
    expect(store.isHintSeen("home")).toBe(false);
    store.markHintSeen("home");
    store.markHintSeen("home");
    expect(createProgressStore(kv).isHintSeen("home")).toBe(true);
    expect(createProgressStore(kv).load().hintsSeen).toEqual(["home"]);
  });

  it("нет незаконченного — карточки нет; устаревшие или битые ответы не считаются", () => {
    expect(pickContinue([a, b], {})).toBeNull();
    const at = "2026-10-17T10:00:00Z";
    expect(resumeAnswers(b, { answers: [0, 0, 0, 0, 0], at })).toBeNull(); // уже весь тест
    expect(resumeAnswers(b, { answers: [0, 7], at })).toBeNull(); // такого варианта нет
    expect(resumeAnswers(b, { answers: [], at })).toBeNull();
    expect(resumeAnswers(b, { answers: [0, 2], at })).toEqual([0, 2]);
    expect(pickContinue([b], { b: { answers: [0, 7], at } })).toBeNull();
    expect(pickContinue([b], { gone: { answers: [0], at } })).toBeNull();
  });
});
