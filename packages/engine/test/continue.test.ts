import { describe, expect, it } from "vitest";
import { createMemoryKeyValueStore, createProgressStore, pickContinue, resumeAnswers, type ContinueTest } from "../src/index";

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
