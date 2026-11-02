import { describe, expect, it } from "vitest";
import { quizFileSchema, type QuizCategory, type QuizCourt, type QuizSuper } from "@gazgame/content";
import kinoJson from "@gazgame/content/data/quiz/kino.json";
import musicJson from "@gazgame/content/data/quiz/music.json";
import generalJson from "@gazgame/content/data/quiz/general.json";
import riddleJson from "@gazgame/content/data/quiz/riddle.json";
import superJson from "@gazgame/content/data/quiz/super.json";
import courtJson from "@gazgame/content/data/quiz/court.json";
import {
  answerQuiz,
  buildRound,
  buildSuperRound,
  courtResult,
  currentPlayer,
  dailyAnswered,
  dailyQuestion,
  nextQuiz,
  quizPlayers,
  quizSummary,
  recordDaily,
  showStreak,
  startQuiz,
  toggleRisk,
  fiftyFifty,
  takeHelp,
  emptyShow,
} from "../src";

const quiz = [kinoJson, musicJson, generalJson, riddleJson, superJson, courtJson].map((j) => quizFileSchema.parse(j));
const categories = quiz.filter((q): q is QuizCategory => q.kind === "category");
const kino = categories.find((c) => c.id === "kino") as QuizCategory;

describe("квиз $HOW: данные", () => {
  it("в каждой категории есть вопросы всех трёх уровней и они помечены draft", () => {
    expect(categories.map((c) => c.id).sort()).toEqual(["general", "kino", "music", "riddle"]);
    for (const c of categories) {
      expect(c.questions).toHaveLength(3);
      expect(c.questions.map((q) => q.level)).toEqual([1, 2, 3]);
      expect(c.questions.every((q) => q.draft === true)).toBe(true);
    }
  });
});

describe("квиз $HOW: раунд", () => {
  it("раунд категории — по вопросу каждого уровня по порядку", () => {
    expect(buildRound(kino).map((q) => q.level)).toEqual([1, 2, 3]);
  });

  it("супер-квиз берёт count вопросов по возрастанию уровня", () => {
    const sup = quiz.find((q): q is QuizSuper => q.kind === "super") as QuizSuper;
    const round = buildSuperRound(sup, categories);
    expect(round).toHaveLength(sup.count);
    const levels = round.map((q) => q.level);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
  });

  it("соло: очки за верные ответы, итоги", () => {
    let s = startQuiz(buildRound(kino), "solo");
    for (const q of s.questions) {
      s = nextQuiz(answerQuiz(s, q.correct));
    }
    expect(s.phase).toBe("done");
    expect(quizSummary(s)).toMatchObject({ total: 3, max: 3, correct: 3 });
  });

  it("неверный ответ и «время вышло» очков не дают", () => {
    let s = startQuiz(buildRound(kino), "solo");
    s = nextQuiz(answerQuiz(s, (s.questions[0]!.correct + 1) % 4));
    s = nextQuiz(answerQuiz(s, -1));
    expect(s.scores).toEqual([0]);
    expect(s.results).toEqual([false, false]);
  });

  it("ответ нельзя дать дважды на один вопрос", () => {
    const s = answerQuiz(startQuiz(buildRound(kino), "solo"), 0);
    expect(answerQuiz(s, 1)).toBe(s);
  });

  it("вдвоём игроки отвечают по очереди, счёт у каждого свой", () => {
    let s = startQuiz(buildRound(kino), "duo");
    expect(currentPlayer(s)).toBe(0);
    s = nextQuiz(answerQuiz(s, s.questions[0]!.correct));
    expect(currentPlayer(s)).toBe(1);
    s = nextQuiz(answerQuiz(s, s.questions[1]!.correct));
    expect(s.scores).toEqual([1, 1]);
    expect(quizSummary(s).total).toBe(2);
  });

  it("компания: победитель — у кого больше очков", () => {
    let s = startQuiz(buildRound(kino), "party", quizPlayers("party", 4));
    expect(s.players).toBe(4);
    for (const q of s.questions) s = nextQuiz(answerQuiz(s, q.correct));
    expect(quizSummary(s).winners).toEqual([0, 1, 2]);
  });

  it("«50:50» убирает два неверных, верный остаётся, один раз", () => {
    const s = startQuiz(buildRound(kino), "solo");
    const f = fiftyFifty(s, () => 0);
    expect(f.hidden).toHaveLength(2);
    expect(f.hidden).not.toContain(f.questions[0]!.correct);
    expect(fiftyFifty(f, () => 0.9)).toBe(f);
    // убранный вариант выбрать нельзя
    expect(answerQuiz(f, f.hidden[0] as number)).toBe(f);
    // на следующем вопросе убранные варианты снова на месте
    const after = nextQuiz(answerQuiz(f, f.questions[0]!.correct));
    expect(after.hidden).toEqual([]);
  });

  it("«спроси зал» и «телефон другу» берутся по разу", () => {
    const s = takeHelp(startQuiz(buildRound(kino), "solo"), "hall");
    expect(s.helps.hall).toBe(true);
    expect(takeHelp(s, "hall")).toBe(s);
  });

  it("«риск ×2»: верный ответ даёт два очка, потом риск потрачен", () => {
    let s = toggleRisk(startQuiz(buildRound(kino), "solo"));
    expect(s.riskArmed).toBe(true);
    s = nextQuiz(answerQuiz(s, s.questions[0]!.correct));
    expect(s.scores).toEqual([2]);
    expect(toggleRisk(s)).toBe(s);
  });

  it("квиз без вопросов сразу готов", () => {
    expect(startQuiz([], "solo").phase).toBe("done");
  });
});

describe("квиз $HOW: суд присяжных", () => {
  const court = quiz.find((q): q is QuizCourt => q.kind === "court") as QuizCourt;
  it("очко — за совпадение с большинством", () => {
    const c = court.cases[0]!;
    expect(courtResult(c, "free").withMajority).toBe(true);
    expect(courtResult(c, "guilty").withMajority).toBe(false);
    expect(courtResult(c, "guilty").guiltyPercent + courtResult(c, "guilty").freePercent).toBe(100);
  });
});

describe("квиз $HOW: вопрос дня", () => {
  const day1 = new Date("2026-10-13T09:00:00Z");
  const day2 = new Date("2026-10-14T09:00:00Z");
  const day4 = new Date("2026-10-16T09:00:00Z");

  it("вопрос один и тот же в течение дня и меняется на следующий", () => {
    expect(dailyQuestion(categories, day1)).toEqual(dailyQuestion(categories, new Date("2026-10-13T20:00:00Z")));
    expect(dailyQuestion(categories, day1)).not.toEqual(dailyQuestion(categories, day2));
  });

  it("серия растёт по дням подряд и обрывается после пропуска; за день считается один раз", () => {
    let d = recordDaily(emptyShow(), true, day1);
    expect(dailyAnswered(d, day1)).toBe(true);
    expect(recordDaily(d, false, day1)).toBe(d);
    d = recordDaily(d, true, day2);
    expect(showStreak(d, day2)).toBe(2);
    expect(showStreak(d, day4)).toBe(0);
    expect(recordDaily(d, true, day4).streak).toBe(1);
    expect(recordDaily(d, true, day4).best).toBe(2);
  });
});
