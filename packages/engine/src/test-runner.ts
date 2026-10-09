// Подсчёт результата теста. Движок не знает конкретных тестов — всё берёт из данных.
import type { BlendNote, ScoringConfig, Test, TestOption, TestResult } from "@gazgame/content";

/** Второй тип в смешанном результате: «Холерик с нотками меланхолика». */
export interface TestBlend {
  resultId: string;
  result: TestResult;
  note: BlendNote;
}

export interface TestScore {
  resultId: string;
  result: TestResult;
  /** Баллы по каждому результату/шкале — пригодятся для «глубокого» разбора и ИИ-агентов. */
  scores: Record<string, number>;
  /** Есть, если второй тип отстал не больше чем на scoring.blend.maxGap. */
  blend?: TestBlend;
}

/** Настройки подсчёта в полной записи (короткая "types" превращается в { type: "types" }). */
export function scoringConfig(test: Test): ScoringConfig {
  return typeof test.scoring === "string" ? { type: test.scoring } : test.scoring;
}

/** Сколько баллов даёт вариант ответа. `type` — это +1, `scores` — точные баллы. */
export function optionScores(option: TestOption): Record<string, number> {
  const scores: Record<string, number> = { ...option.scores };
  if (option.type) scores[option.type] = (scores[option.type] ?? 0) + 1;
  return scores;
}

/**
 * Считает результат.
 * @param answers индекс выбранного варианта для каждого вопроса по порядку
 */
export function scoreTest(test: Test, answers: readonly number[]): TestScore {
  if (answers.length !== test.questions.length) {
    throw new Error(`Тест "${test.id}": ответов ${answers.length}, а вопросов ${test.questions.length}`);
  }

  const config = scoringConfig(test);
  const tieQuestions = new Set(config.tieBreak?.lastQuestions);
  const scores: Record<string, number> = Object.fromEntries(test.results.map((r) => [r.id, 0]));
  /** Баллы только за вопросы из tieBreak.lastQuestions — ими решается ничья. */
  const tieScores: Record<string, number> = {};
  answers.forEach((optionIndex, questionIndex) => {
    const question = test.questions[questionIndex];
    const option = question?.options[optionIndex];
    if (!option) throw new Error(`Тест "${test.id}": нет варианта ${optionIndex} в вопросе ${questionIndex + 1}`);
    const counts = question.id !== undefined && tieQuestions.has(question.id);
    for (const [key, value] of Object.entries(optionScores(option))) {
      scores[key] = (scores[key] ?? 0) + value;
      if (counts) tieScores[key] = (tieScores[key] ?? 0) + value;
    }
  });

  switch (config.type) {
    case "types": {
      // Места: больше баллов → больше баллов в последних вопросах → раньше в scoring.types (или в results).
      const order = config.types ?? [];
      const position = (r: TestResult) => (order.includes(r.id) ? order.indexOf(r.id) : order.length + test.results.indexOf(r));
      const ranked = [...test.results].sort(
        (a, b) =>
          (scores[b.id] ?? 0) - (scores[a.id] ?? 0) ||
          (tieScores[b.id] ?? 0) - (tieScores[a.id] ?? 0) ||
          position(a) - position(b),
      );
      const [best, second] = ranked as [TestResult, TestResult | undefined];
      const score: TestScore = { resultId: best.id, result: best, scores };

      const note = second && test.blendNotes?.[second.id];
      if (config.blend && second && note && (scores[best.id] ?? 0) - (scores[second.id] ?? 0) <= config.blend.maxGap) {
        score.blend = { resultId: second.id, result: second, note };
      }
      return score;
    }
    default: {
      const unknown: never = config.type;
      throw new Error(`Неизвестный способ подсчёта: ${String(unknown)}`);
    }
  }
}

export function findResult(test: Test, resultId: string): TestResult | undefined {
  return test.results.find((r) => r.id === resultId);
}

/** Пары «основной тип + нотки второго», для которых в тесте есть blendNotes (для страниц смешанных результатов). */
export function blendPairs(test: Test): { resultId: string; blendId: string }[] {
  if (!scoringConfig(test).blend || !test.blendNotes) return [];
  const notes = test.blendNotes;
  return test.results.flatMap((main) =>
    test.results.filter((r) => r.id !== main.id && notes[r.id]).map((r) => ({ resultId: main.id, blendId: r.id })),
  );
}
