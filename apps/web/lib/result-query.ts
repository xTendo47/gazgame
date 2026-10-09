// Баллы в адресе результата: /test/<slug>/result/<id>?acceptance=7&confidence=5&independence=9
// Страницы результатов статические, а баллы у каждого свои — поэтому они едут в адресе.
// Так ссылкой можно поделиться, и у друга откроется тот же разбор.
// Нужны тестам по шкалам (scales) и тестам с полосками всех типов (scoring.showRanking).
import type { Test } from "@gazgame/content";
import {
  scaleBreakdown,
  scalesConfig,
  scoringConfig,
  typeRanking,
  type RankedType,
  type ScalesBreakdown,
} from "@gazgame/engine";

type Params = { get(name: string): string | null };

/** Нужно ли передавать баллы в адресе результата. */
export function needsScoresInQuery(test: Test): boolean {
  const config = scoringConfig(test);
  return config.type === "scales" || config.showRanking === true;
}

export function scoreQuery(scores: Readonly<Record<string, number>>): string {
  return `?${new URLSearchParams(Object.entries(scores).map(([k, v]) => [k, String(v)]))}`;
}

/** Целые неотрицательные баллы для каждого id из адреса. null — если хоть одного нет. */
function readScores(ids: readonly string[], params: Params): Record<string, number> | null {
  const scores: Record<string, number> = {};
  for (const id of ids) {
    const raw = params.get(id);
    if (raw === null || !/^\d+$/.test(raw)) return null;
    scores[id] = Number(raw);
  }
  return scores;
}

/** Разбор по шкалам из адреса. null — если шкал в адресе нет или они не сходятся с результатом. */
export function scalesFromQuery(test: Test, params: Params, range?: readonly [number, number]): ScalesBreakdown | null {
  const config = scalesConfig(test);
  const scores = config && readScores(config.scales.map((s) => s.id), params);
  const breakdown = scores ? scaleBreakdown(test, scores) : null;
  if (!breakdown || (range && (breakdown.total < range[0] || breakdown.total > range[1]))) return null;
  return breakdown;
}

/** Все типы от сильного к слабому из адреса. null — если баллов нет или они не сходятся с результатом. */
export function rankingFromQuery(test: Test, params: Params, lead: { resultId: string; blendId?: string }): RankedType[] | null {
  const scores = readScores(test.results.map((r) => r.id), params);
  return scores ? typeRanking(test, scores, lead) : null;
}
