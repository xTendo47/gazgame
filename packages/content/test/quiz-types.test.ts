import { describe, expect, it } from "vitest";
import { buildCatalog } from "../src/index";

describe("Квиз $HOW: два типа вопросов (choice и input)", () => {
  const head = { id: "x", kind: "category", title: "Т", subtitle: "П" };
  const choice = (id: string, level: number) => ({ id, level, text: "в", options: ["a", "b", "c", "d"], correct: 0 });
  const bank = (extra: Record<string, unknown>[]) => ({ ...head, questions: [choice("c1", 1), choice("c2", 2), choice("c3", 3), ...extra] });
  const build = (file: Record<string, unknown>) => buildCatalog([], { quiz: [{ path: "quiz/x.json", data: file }] });

  it("вопрос с вводом: непустой answers и time обязательны", () => {
    expect(() => build(bank([{ id: "i1", level: 1, type: "input", text: "в", answers: ["а"], time: 30 }]))).not.toThrow();
    expect(() => build(bank([{ id: "i1", level: 1, type: "input", text: "в", answers: [], time: 30 }]))).toThrow(/хотя бы один/);
    expect(() => build(bank([{ id: "i1", level: 1, type: "input", text: "в", answers: ["а"] }]))).toThrow();
    expect(() => build(bank([{ id: "i1", level: 1, type: "input", text: "в", answers: ["a", "b"], time: 4 }]))).toThrow();
  });

  it("вопрос с вариантами: ровно 4 варианта и correct, варианты не повторяются", () => {
    expect(() => build(bank([{ id: "c9", level: 1, type: "choice", text: "в", options: ["a", "b", "c", "d"], correct: 2 }]))).not.toThrow();
    expect(() => build(bank([{ id: "c9", level: 1, text: "в", options: ["a", "b", "c"], correct: 0 }]))).toThrow();
    expect(() => build(bank([{ id: "c9", level: 1, text: "в", options: ["a", "b", "c", "d"] }]))).toThrow();
    expect(() => build(bank([{ id: "c9", level: 1, text: "в", options: ["a", "A", "c", "d"], correct: 0 }]))).toThrow(/повторяются/);
  });

  it("у вопроса с вводом не должно быть вариантов, у choice — answers", () => {
    expect(() => build(bank([{ id: "i1", level: 1, type: "input", text: "в", answers: ["а"], time: 30, options: ["a", "b", "c", "d"] }]))).toThrow();
    expect(() => build(bank([{ id: "c9", level: 1, type: "choice", text: "в", options: ["a", "b", "c", "d"], correct: 0, answers: ["а"] }]))).toThrow();
  });
});
