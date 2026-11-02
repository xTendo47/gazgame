import { describe, expect, it } from "vitest";
import { quizBankWarnings, quizFileSchema, type QuizCategory, type QuizChoiceQuestion, type QuizCourt, type QuizQuestion, type QuizSuper } from "@gazgame/content";
import kinoJson from "@gazgame/content/data/quiz/kino.json";
import rapJson from "@gazgame/content/data/quiz/rap-ru.json";
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
  nextSeen,
  shuffleOptions,
  showStreak,
  startQuiz,
  toggleRisk,
  fiftyFifty,
  takeHelp,
  emptyShow,
} from "../src";

/** Номер верного варианта у вопроса с вариантами (у вопроса с вводом его нет). */
const right = (q: QuizQuestion): number => (q.type === "input" ? -1 : q.correct);

const quiz = [kinoJson, rapJson, generalJson, riddleJson, superJson, courtJson].map((j) => quizFileSchema.parse(j));
const categories = quiz.filter((q): q is QuizCategory => q.kind === "category");
const kino = categories.find((c) => c.id === "kino") as QuizCategory;

describe("квиз $HOW: данные", () => {
  it("в каждой категории есть вопросы всех трёх уровней; Кино, Общее и Загадки — настоящие банки по 90, Русский хип-хоп — демо с draft", () => {
    expect(categories.map((c) => c.id).sort()).toEqual(["general", "kino", "rap-ru", "riddle"]);
    for (const c of categories) {
      expect([...new Set(c.questions.map((q) => q.level))].sort()).toEqual([1, 2, 3]);
      const real = c.id !== "rap-ru";
      expect(c.questions).toHaveLength(real ? 90 : 3);
      expect(c.questions.every((q) => (q.draft === true) === !real)).toBe(true);
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
      s = nextQuiz(answerQuiz(s, right(q)));
    }
    expect(s.phase).toBe("done");
    expect(quizSummary(s)).toMatchObject({ total: 3, max: 3, correct: 3 });
  });

  it("неверный ответ и «время вышло» очков не дают", () => {
    let s = startQuiz(buildRound(kino), "solo");
    s = nextQuiz(answerQuiz(s, (right(s.questions[0]!) + 1) % 4));
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
    s = nextQuiz(answerQuiz(s, right(s.questions[0]!)));
    expect(currentPlayer(s)).toBe(1);
    s = nextQuiz(answerQuiz(s, right(s.questions[1]!)));
    expect(s.scores).toEqual([1, 1]);
    expect(quizSummary(s).total).toBe(2);
  });

  it("компания: победитель — у кого больше очков", () => {
    let s = startQuiz(buildRound(kino), "party", quizPlayers("party", 4));
    expect(s.players).toBe(4);
    for (const q of s.questions) s = nextQuiz(answerQuiz(s, right(q)));
    expect(quizSummary(s).winners).toEqual([0, 1, 2]);
  });

  it("«50:50» убирает два неверных, верный остаётся, один раз", () => {
    const s = startQuiz(buildRound(kino), "solo");
    const f = fiftyFifty(s, () => 0);
    expect(f.hidden).toHaveLength(2);
    expect(f.hidden).not.toContain(right(f.questions[0]!));
    expect(fiftyFifty(f, () => 0.9)).toBe(f);
    // убранный вариант выбрать нельзя
    expect(answerQuiz(f, f.hidden[0] as number)).toBe(f);
    // на следующем вопросе убранные варианты снова на месте
    const after = nextQuiz(answerQuiz(f, right(f.questions[0]!)));
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
    s = nextQuiz(answerQuiz(s, right(s.questions[0]!)));
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

/** Синтетический банк для проверки механики (не контент): 4 вопроса на каждый из трёх уровней. */
function syntheticBank(id: string, perLevel = 4): QuizCategory {
  return {
    kind: "category",
    id,
    title: id,
    subtitle: id,
    questions: [1, 2, 3].flatMap((level) =>
      Array.from({ length: perLevel }, (_, i) => ({
        id: `${id}-${level}-${i}`,
        level,
        text: `вопрос ${id} ${level}.${i}`,
        options: [`a${i}`, `b${i}`, `c${i}`, `d${i}`],
        correct: i % 4,
      })),
    ),
  };
}

describe("квиз $HOW: банки вопросов", () => {
  it("варианты перемешиваются, верный ответ находится по тексту", () => {
    const q = syntheticBank("t").questions[2] as QuizChoiceQuestion;
    const rightText = q.options[q.correct];
    const reversed = shuffleOptions(q, () => 0) as QuizChoiceQuestion;
    expect(reversed.options).not.toEqual(q.options);
    expect([...reversed.options].sort()).toEqual([...q.options].sort());
    expect(reversed.options[reversed.correct]).toBe(rightText);
    for (let n = 0; n < 20; n++) {
      const s = shuffleOptions(q) as QuizChoiceQuestion;
      expect(s.options[s.correct]).toBe(rightText);
    }
  });

  it("при повторном прохождении вопросы другие, пока не кончился банк уровня", () => {
    const bank = syntheticBank("kino");
    let seen = new Set<string>();
    const shown: string[][] = [];
    for (let run = 0; run < 4; run++) {
      const round = buildRound(bank, Math.random, seen);
      expect(round.map((q) => q.level)).toEqual([1, 2, 3]);
      shown.push(round.map((q) => q.id));
      seen = nextSeen([bank], round, seen);
    }
    // 4 прохода по банку из 4 вопросов на уровень: на каждом уровне все четыре вопроса разные
    for (let level = 0; level < 3; level++) expect(new Set(shown.map((r) => r[level])).size).toBe(4);
  });

  it("когда банк уровня закончился, перемешивается и начинается заново", () => {
    const bank = syntheticBank("music", 2);
    let seen = new Set<string>();
    const ids: string[] = [];
    for (let run = 0; run < 5; run++) {
      const round = buildRound(bank, Math.random, seen);
      ids.push(round[0]?.id as string);
      seen = nextSeen([bank], round, seen);
    }
    // в каждой паре подряд идущих проходов (1–2, 3–4) первый уровень не повторяется
    expect(ids[0]).not.toBe(ids[1]);
    expect(ids[2]).not.toBe(ids[3]);
    // отметки не растут бесконечно: после круга остаётся не больше размера банка
    expect(seen.size).toBeLessThanOrEqual(bank.questions.length);
  });

  it("супер-квиз берёт вопросы из тех же банков, без повторов, по возрастанию уровня", () => {
    const banks = ["general", "kino", "music", "riddle"].map((id) => syntheticBank(id));
    const sup = { kind: "super", id: "super", title: "s", subtitle: "s", from: banks.map((b) => b.id), count: 6, ladder: ["1", "2", "3", "4", "5", "6"], safe: [3], prize: "p" } as QuizSuper;
    const round = buildSuperRound(sup, banks, Math.random, new Set());
    expect(round).toHaveLength(6);
    expect(new Set(round.map((q) => q.id)).size).toBe(6);
    const levels = round.map((q) => q.level);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
    const bankIds = new Set(banks.flatMap((b) => b.questions.map((q) => q.id)));
    expect(round.every((q) => bankIds.has(q.id))).toBe(true);
  });

  it("вопрос дня берётся из банков и не зависит от порядка вариантов", () => {
    const banks = [syntheticBank("kino"), syntheticBank("general")];
    const day = new Date("2026-10-20T09:00:00Z");
    const q = dailyQuestion(banks, day) as QuizQuestion;
    expect(banks.flatMap((b) => b.questions.map((x) => x.id))).toContain(q.id);
    expect(dailyQuestion(banks, day)?.id).toBe(q.id);
  });

  it("предупреждение, если в уровне меньше 30 вопросов без draft", () => {
    const small = quizBankWarnings([syntheticBank("kino", 29)]);
    expect(small).toHaveLength(3);
    expect(small[0]).toMatch(/уровень 1.*29 из 30/);
    expect(quizBankWarnings([syntheticBank("kino", 30)])).toEqual([]);
    const drafts: QuizCategory = { ...syntheticBank("kino", 30), questions: syntheticBank("kino", 30).questions.map((q) => ({ ...q, draft: true })) };
    expect(quizBankWarnings([drafts])).toHaveLength(3);
  });
});
