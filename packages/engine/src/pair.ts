// Сравнение пары по тесту «Ценности» (test.pair): процент, название пары, бесплатная строка и зоны.
// Это движок без интерфейса: экран пары («Партнёр рядом», ссылка) появится отдельно, сейчас в MVP — замок 💎 и счёт нажатий.
import type { Test, TestResult } from "@gazgame/content";
import { scoreTest } from "./test-runner";

export type ZoneState = "green" | "yellow" | "red";

export interface PairZone {
  id: string;
  emoji: string;
  title: string;
  /** green — оба ответа совпали, yellow — один, red — ни одного. */
  state: ZoneState;
  /** Для green — «совпадаете», иначе вопрос для разговора. */
  text: string;
  matches: number;
}

export interface PairComparison {
  /** 0–100: 50% × сходство карт + 50% × доля одинаковых ответов. */
  percent: number;
  name: { emoji: string; title: string; text: string };
  /** Бесплатная строка: текст названия + «Вас объединяет {ценность}.» или «Общих ценностей в топ-3 нет…». */
  freeLine: string;
  /** Первая общая ценность из двух топ-3 (по порядку первого человека). */
  shared?: TestResult;
  /** Premium 💎: зоны пары. */
  zones: PairZone[];
  /** Premium 💎: вопрос для разговора на неделю — по самой «красной» зоне (при равенстве первая по порядку). */
  talk?: string;
}

/** Сравнивает ответы двух людей (индексы вариантов по вопросам, как в файле). null — тест без блоков pair и valueMap. */
export function comparePair(test: Test, a: readonly number[], b: readonly number[]): PairComparison | null {
  const pair = test.pair;
  const top = test.valueMap?.top;
  if (!pair || !top) return null;
  const A = scoreTest(test, a);
  const B = scoreTest(test, b);

  // сходство карт: 100 − сумма |разниц баллов| / (2 × баллов у человека) × 100
  const total = test.questions.length * 2;
  const diff = test.results.reduce((sum, r) => sum + Math.abs((A.scores[r.id] ?? 0) - (B.scores[r.id] ?? 0)), 0);
  const similarity = 100 - (diff / (2 * total)) * 100;
  const sameAnswers = a.filter((x, i) => x === b[i]).length / test.questions.length;
  const percent = Math.round(0.5 * similarity + 0.5 * sameAnswers * 100);

  const name = [...pair.names].sort((x, y) => y.minPercent - x.minPercent).find((n) => percent >= n.minPercent) ?? (pair.names[0] as (typeof pair.names)[number]);

  const topA = (A.order ?? []).slice(0, top);
  const topB = new Set((B.order ?? []).slice(0, top));
  const sharedId = topA.find((id) => topB.has(id));
  const shared = sharedId ? test.results.find((r) => r.id === sharedId) : undefined;
  const freeLine = `${name.text} ${shared ? pair.shared.replace("{value}", `${shared.emoji} ${shared.title}`) : pair.noShared}`;

  const zones: PairZone[] = pair.zones.map((zone) => {
    const indexes = test.questions.flatMap((q, i) => (q.zone === zone.id ? [i] : []));
    const matches = indexes.filter((i) => a[i] === b[i]).length;
    const state: ZoneState = matches === indexes.length ? "green" : matches === 0 ? "red" : "yellow";
    return { id: zone.id, emoji: zone.emoji, title: zone.title, state, text: state === "green" ? zone.same : zone.differ, matches };
  });
  const worst = zones.filter((z) => z.state !== "green").sort((x, y) => x.matches - y.matches)[0];

  return { percent, name: { emoji: name.emoji, title: name.title, text: name.text }, freeLine, shared, zones, talk: worst?.text };
}
