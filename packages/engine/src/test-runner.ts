// Подсчёт результата теста. Движок не знает конкретных тестов — всё берёт из данных.
import { largestRemainderPercents } from "./percent";
import type {
  BlendNote,
  Scale,
  ScalesScoring,
  ScoringConfig,
  Test,
  TestOption,
  TestResult,
  TypesScoring,
} from "@gazgame/content";

/** Второй тип в смешанном результате: «Холерик с нотками меланхолика». */
export interface TestBlend {
  resultId: string;
  result: TestResult;
  note: BlendNote;
}

/** Одна шкала в тесте с подсчётом "scales". */
export interface ScaleScore {
  scale: Scale;
  score: number;
  /** id уровня из scaleLevels, например "low". */
  level?: string;
  /** Текст из zones для этой шкалы и уровня. */
  zone?: string;
}

/** Опора и зона роста — или «ровный профиль», если шкалы почти одинаковые. */
export type ScalesProfile = { kind: "flat" } | { kind: "peaks"; strongest: ScaleScore; weakest: ScaleScore };

export interface ScalesBreakdown {
  total: number;
  totalMax: number;
  scales: ScaleScore[];
  profile: ScalesProfile;
  /** Самая слабая шкала — есть всегда (нужна, например, для текста upsell). */
  weakest: ScaleScore;
}

export interface TestScore {
  resultId: string;
  result: TestResult;
  /** Баллы по каждому результату/шкале — пригодятся для «глубокого» разбора и ИИ-агентов. */
  scores: Record<string, number>;
  /** Есть, если второй тип отстал не больше чем на scoring.blend.maxGap. */
  blend?: TestBlend;
  /** Есть у тестов с подсчётом "scales". */
  scales?: ScalesBreakdown;
}

/** Настройки подсчёта в полной записи (короткая "types" превращается в { type: "types" }). */
export function scoringConfig(test: Test): ScoringConfig {
  return typeof test.scoring === "string" ? { type: test.scoring } : test.scoring;
}

/** Настройки шкал, если тест считается по шкалам. */
export function scalesConfig(test: Test): ScalesScoring | null {
  const config = scoringConfig(test);
  return config.type === "scales" ? config : null;
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
  const chosen = answers.map((optionIndex, questionIndex) => {
    const question = test.questions[questionIndex];
    const option = question?.options[optionIndex];
    if (!question || !option) {
      throw new Error(`Тест "${test.id}": нет варианта ${optionIndex} в вопросе ${questionIndex + 1}`);
    }
    return { question, option };
  });

  const config = scoringConfig(test);
  switch (config.type) {
    case "types":
      return scoreTypes(test, config, chosen);
    case "scales": {
      const scores: Record<string, number> = Object.fromEntries(config.scales.map((sc) => [sc.id, 0]));
      for (const { question, option } of chosen) {
        if (question.scale) scores[question.scale] = (scores[question.scale] ?? 0) + (option.score ?? 0);
      }
      const scales = scaleBreakdown(test, scores) as ScalesBreakdown;
      const result = resultForTotal(test, scales.total);
      return { resultId: result.id, result, scores, scales };
    }
    default: {
      const unknown: never = config;
      throw new Error(`Неизвестный способ подсчёта: ${JSON.stringify(unknown)}`);
    }
  }
}

type Chosen = { question: Test["questions"][number]; option: TestOption }[];

/** Места: больше баллов → больше баллов в последних вопросах → раньше в scoring.types (или в results). */
function scoreTypes(test: Test, config: TypesScoring, chosen: Chosen): TestScore {
  const tieQuestions = new Set(config.tieBreak?.lastQuestions);
  const scores: Record<string, number> = Object.fromEntries(test.results.map((r) => [r.id, 0]));
  /** Баллы только за вопросы из tieBreak.lastQuestions — ими решается ничья. */
  const tieScores: Record<string, number> = {};
  for (const { question, option } of chosen) {
    const counts = question.id !== undefined && tieQuestions.has(question.id);
    for (const [key, value] of Object.entries(optionScores(option))) {
      scores[key] = (scores[key] ?? 0) + value;
      if (counts) tieScores[key] = (tieScores[key] ?? 0) + value;
    }
  }

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

/**
 * Разбор по шкалам из готовых баллов (например, из ссылки на результат).
 * Возвращает null, если тест не по шкалам или баллы не подходят (нет шкалы, не число, больше максимума).
 */
export function scaleBreakdown(test: Test, scores: Readonly<Record<string, number>>): ScalesBreakdown | null {
  const config = scalesConfig(test);
  if (!config) return null;

  const scales: ScaleScore[] = [];
  for (const scale of config.scales) {
    const score = scores[scale.id];
    if (score === undefined || !Number.isFinite(score) || score < 0 || score > scale.max) return null;
    const level = Object.entries(config.scaleLevels).find(([, [from, to]]) => from <= score && score <= to)?.[0];
    const zone = level === undefined ? undefined : test.zones?.[scale.id]?.[level];
    scales.push({ scale, score, level, zone });
  }

  // При равных баллах опорой/зоной роста становится шкала, что раньше в списке scales.
  const strongest = scales.reduce((best, s) => (s.score > best.score ? s : best));
  const weakest = scales.reduce((low, s) => (s.score < low.score ? s : low));
  const flat = strongest.score - weakest.score <= config.flatGap;

  return {
    total: scales.reduce((sum, s) => sum + s.score, 0),
    totalMax: config.scales.reduce((sum, sc) => sum + sc.max, 0),
    scales,
    profile: flat ? { kind: "flat" } : { kind: "peaks", strongest, weakest },
    weakest,
  };
}

/** Результат по сумме баллов (results[].range). Если диапазона нет — ближайший. */
export function resultForTotal(test: Test, total: number): TestResult {
  const exact = test.results.find((r) => r.range && r.range[0] <= total && total <= r.range[1]);
  if (exact) return exact;
  const distance = (r: TestResult) => (r.range ? Math.min(Math.abs(r.range[0] - total), Math.abs(r.range[1] - total)) : Infinity);
  return test.results.reduce((best, r) => (distance(r) < distance(best) ? r : best));
}

/**
 * Подставляет значения в текст: «Твоя зона роста — «{weakestScale}».».
 * Если значения нет, предложение с этой вставкой убирается целиком — чтобы не показать «{weakestScale}».
 */
export function fillPlaceholders(text: string, values: Readonly<Record<string, string | undefined>>): string {
  return text
    .split(/(?<=[.!?…])\s+/)
    .filter((sentence) => [...sentence.matchAll(/\{(\w+)\}/g)].every((m) => values[m[1] as string] !== undefined))
    .map((sentence) => sentence.replace(/\{(\w+)\}/g, (_, key: string) => values[key] as string))
    .join(" ");
}

/** Сколько баллов максимум может набрать каждый результат (для полосок «баллы / максимум»). */
export function typeMaxima(test: Test): Record<string, number> {
  const max: Record<string, number> = Object.fromEntries(test.results.map((r) => [r.id, 0]));
  for (const question of test.questions) {
    for (const id of Object.keys(max)) {
      max[id] = (max[id] ?? 0) + Math.max(0, ...question.options.map((o) => optionScores(o)[id] ?? 0));
    }
  }
  return max;
}

export interface RankedType {
  result: TestResult;
  score: number;
  max: number;
  /** Доля баллов от суммы всех результатов, проценты в сумме ровно 100 (как на карточке для шеринга). */
  percent: number;
}

/**
 * Все типы от сильного к слабому (scoring.showRanking).
 * При равных баллах впереди основной результат, затем второй (blend), затем порядок scoring.types.
 * Возвращает null, если баллы не подходят: нет типа, не число, больше максимума или основной результат не на первом месте.
 */
export function typeRanking(
  test: Test,
  scores: Readonly<Record<string, number>>,
  lead: { resultId?: string; blendId?: string } = {},
): RankedType[] | null {
  const config = scoringConfig(test);
  if (config.type !== "types") return null;
  const maxima = typeMaxima(test);
  const ranked: RankedType[] = [];
  for (const result of test.results) {
    const score = scores[result.id];
    const max = maxima[result.id] ?? 0;
    if (score === undefined || !Number.isFinite(score) || score < 0 || score > max) return null;
    ranked.push({ result, score, max, percent: 0 });
  }
  const order = config.types ?? [];
  const priority = (id: string) =>
    id === lead.resultId ? -2 : id === lead.blendId ? -1 : order.includes(id) ? order.indexOf(id) : order.length + 1;
  ranked.sort((a, b) => b.score - a.score || priority(a.result.id) - priority(b.result.id));
  if (lead.resultId && ranked[0]?.result.id !== lead.resultId) return null;
  // Проценты считаем уже по порядку показа: при равных баллах лишний процент получает тот, кто выше
  const percents = largestRemainderPercents(ranked.map((r) => r.score));
  ranked.forEach((r, i) => (r.percent = percents[i] ?? 0));
  return ranked;
}

export function findResult(test: Test, resultId: string): TestResult | undefined {
  return test.results.find((r) => r.id === resultId);
}

/** Пары «основной тип + нотки второго», для которых в тесте есть blendNotes (для страниц смешанных результатов). */
export function blendPairs(test: Test): { resultId: string; blendId: string }[] {
  const config = scoringConfig(test);
  if (config.type !== "types" || !config.blend || !test.blendNotes) return [];
  const notes = test.blendNotes;
  return test.results.flatMap((main) =>
    test.results.filter((r) => r.id !== main.id && notes[r.id]).map((r) => ({ resultId: main.id, blendId: r.id })),
  );
}
