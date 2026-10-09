// Баллы шкал в адресе результата: /test/<slug>/result/<id>?acceptance=7&confidence=5&independence=9
// Страницы результатов статические, а шкалы у каждого свои — поэтому они едут в адресе.
// Так ссылкой можно поделиться, и у друга откроется тот же разбор.
import type { Test } from "@gazgame/content";
import { scaleBreakdown, scalesConfig, type ScalesBreakdown } from "@gazgame/engine";

export function scaleQuery(scores: Readonly<Record<string, number>>): string {
  return `?${new URLSearchParams(Object.entries(scores).map(([k, v]) => [k, String(v)]))}`;
}

/** Разбор по шкалам из адреса. null — если шкал в адресе нет или они не сходятся с результатом. */
export function scalesFromQuery(
  test: Test,
  params: { get(name: string): string | null },
  range?: readonly [number, number],
): ScalesBreakdown | null {
  const config = scalesConfig(test);
  if (!config) return null;
  const scores: Record<string, number> = {};
  for (const { id } of config.scales) {
    const raw = params.get(id);
    if (raw === null || !/^\d+$/.test(raw)) return null;
    scores[id] = Number(raw);
  }
  const breakdown = scaleBreakdown(test, scores);
  if (!breakdown || (range && (breakdown.total < range[0] || breakdown.total > range[1]))) return null;
  return breakdown;
}
