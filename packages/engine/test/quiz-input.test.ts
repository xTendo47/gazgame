import { describe, expect, it } from "vitest";
import { quizFileSchema, type QuizCategory, type QuizInputQuestion, type QuizQuestion } from "@gazgame/content";
import riddleJson from "@gazgame/content/data/quiz/riddle.json";
import {
  QUIZ_TIME,
  answerQuiz,
  answerText,
  checkAnswer,
  fiftyFifty,
  isInputQuestion,
  normalizeAnswer,
  quizTime,
  shuffleOptions,
  startQuiz,
  takeHelp,
  toggleRisk,
} from "../src";

const input = (answers: string[], time = 30): QuizInputQuestion => ({ id: "in-1", level: 1, text: "Кто?", type: "input", answers, time, explain: "потому что" });
const choice: QuizQuestion = { id: "ch-1", level: 1, text: "Вопрос?", options: ["a", "b", "c", "d"], correct: 0 };
const stateWith = (q: QuizQuestion) => startQuiz([q], "solo");

describe("квиз $HOW: вопросы с вводом", () => {
  it("нормализация: регистр, пробелы по краям, ё = е, кавычки и знаки препинания", () => {
    expect(normalizeAnswer("  «Ёлка», ")).toBe("елка");
    expect(normalizeAnswer("МАША!")).toBe("маша");
    expect(normalizeAnswer("а   б")).toBe("а б");
  });

  it("Маша = маша = МАША, лишние пробелы и знаки не мешают", () => {
    const q = input(["Маша"]);
    for (const typed of ["Маша", "маша", "МАША", "  маша  ", "Маша!", "«маша»"]) expect(checkAnswer(q, typed)).toBe(true);
    expect(checkAnswer(q, "Даша")).toBe(false);
    expect(checkAnswer(q, "")).toBe(false);
    expect(checkAnswer(input(["лёд"]), "лед")).toBe(true);
  });

  it("засчитывается любой из answers", () => {
    const q = input(["сон", "сновидение"]);
    expect(checkAnswer(q, "Сон")).toBe(true);
    expect(checkAnswer(q, "сновидение")).toBe(true);
    expect(checkAnswer(q, "явь")).toBe(false);
  });

  it("у слов длиннее 5 букв прощается одна опечатка (лишняя, пропущенная, неверная буква), две — нет", () => {
    const q = input(["правильно"]);
    expect(checkAnswer(q, "правильна")).toBe(true); // неверная буква
    expect(checkAnswer(q, "правилно")).toBe(true); // пропущена
    expect(checkAnswer(q, "правильнно")).toBe(true); // лишняя
    expect(checkAnswer(q, "првильно")).toBe(true); // пропущена в начале слова
    expect(checkAnswer(q, "првилно")).toBe(false); // две ошибки
    expect(checkAnswer(input(["облако"]), "облоко")).toBe(true);
    // короткие слова (до 5 букв включительно) — только точно
    expect(checkAnswer(input(["слон"]), "сон")).toBe(false);
    expect(checkAnswer(input(["молот"]), "молоп")).toBe(false);
  });

  it("верный ввод даёт очко, неверный и «время вышло» — нет; typed и picked заполнены", () => {
    const ok = answerText(stateWith(input(["Маша"])), "  маша ");
    expect(ok.phase).toBe("answer");
    expect(ok.scores).toEqual([1]);
    expect(ok.typed).toBe("маша");
    const wrong = answerText(stateWith(input(["Маша"])), "Даша");
    expect(wrong.scores).toEqual([0]);
    expect(wrong.picked).toBe(-2);
    const timeout = answerQuiz(stateWith(input(["Маша"])), -1);
    expect(timeout.results).toEqual([false]);
    expect(timeout.typed).toBe("");
  });

  it("вариантом на вопрос с вводом ответить нельзя, текстом на вопрос с вариантами — тоже", () => {
    const s = stateWith(input(["Маша"]));
    expect(answerQuiz(s, 1)).toBe(s);
    const c = stateWith(choice);
    expect(answerText(c, "a")).toBe(c);
  });

  it("время берётся из time вопроса, у обычных — 15 секунд", () => {
    expect(quizTime(input(["а"], 40))).toBe(40);
    expect(quizTime(choice)).toBe(QUIZ_TIME);
    expect(QUIZ_TIME).toBe(15);
  });

  it("«50:50» и «спроси зал» на вопросе с вводом недоступны, «дай телефон другу» и «риск ×2» работают", () => {
    const s = stateWith(input(["Маша"]));
    expect(fiftyFifty(s, () => 0)).toBe(s);
    expect(takeHelp(s, "hall")).toBe(s);
    expect(takeHelp(s, "friend").helps.friend).toBe(true);
    expect(answerText(toggleRisk(s), "маша").scores).toEqual([2]);
  });

  it("в банке Загадок 90 вопросов: на каждом уровне 30, из них 6 с вводом", () => {
    const riddle = quizFileSchema.parse(riddleJson) as QuizCategory;
    expect(riddle.questions).toHaveLength(90);
    for (const level of [1, 2, 3]) {
      const qs = riddle.questions.filter((q) => q.level === level);
      expect(qs).toHaveLength(30);
      expect(qs.filter(isInputQuestion)).toHaveLength(6);
    }
  });

  it("перемешивание вариантов не трогает вопрос с вводом", () => {
    const q = input(["Маша"]);
    expect(shuffleOptions(q)).toBe(q);
  });
});
