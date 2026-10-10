// Шеринг итогов теста: текст сообщения в чат, ссылка на итог и её превью. Проценты — в percent.ts.
import type { Test, TestResult } from "@gazgame/content";
import { findResult, scaleBreakdown, scalesConfig, typeRanking } from "./test-runner";

/** Что подставить в текст сообщения. */
export interface ShareValues {
  /** Ссылка на тест (с ?from=share). */
  link: string;
  /** Процент основного результата в раскладе (для {pct}). */
  pct?: number;
  /** Самая высокая шкала — для тестов по шкалам ({scale} и {emoji}). */
  topScale?: { title: string; emoji: string };
}

/** Надпись на большой кнопке «Куда кидаем?». Нет share у теста — «Пофлексить 🧊». */
export function shareButtonLabel(test: Test): string {
  return test.share?.button ?? "Пофлексить 🧊";
}

/**
 * Текст сообщения в чат: share.text теста с подстановками {title} {emoji} {pct} {scale} {link}.
 * У тестов по шкалам {emoji} — эмодзи самой высокой шкалы. Нет share — shareText результата и ссылка.
 */
export function shareMessage(test: Test, result: TestResult, values: ShareValues): string {
  if (!test.share) return [result.shareText ?? `${result.title} ${result.emoji}`, values.link].join(" ");
  const vars: Record<string, string | undefined> = {
    title: result.title,
    emoji: values.topScale?.emoji ?? result.emoji,
    pct: values.pct === undefined ? undefined : String(values.pct),
    scale: values.topScale?.title,
    link: values.link,
  };
  return test.share.text
    .replace(/\s*\{pct\}%?/g, (m) => (vars.pct === undefined ? "" : m))
    .replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "")
    .replace(/ {2,}/g, " ")
    .trim();
}

// ---------- Ссылка на итог: /test/<slug>?from=share&r=<результат>[&b=<второй тип>]&s=<баллы через точку> ----------

/** В каком порядке идут баллы в параметре s: шкалы у тестов по шкалам, иначе results. */
export function scoreKeys(test: Test): string[] {
  return scalesConfig(test)?.scales.map((s) => s.id) ?? test.results.map((r) => r.id);
}

export interface SharedResult {
  resultId: string;
  blendId?: string;
  scores: Record<string, number>;
}

/** Параметры ссылки на итог (без from=share — его добавляет тот, кто собирает адрес). */
export function sharedResultQuery(test: Test, shared: SharedResult): Record<string, string> {
  const q: Record<string, string> = { r: shared.resultId };
  if (shared.blendId) q.b = shared.blendId;
  const keys = scoreKeys(test);
  if (keys.every((k) => shared.scores[k] !== undefined)) q.s = keys.map((k) => shared.scores[k]).join(".");
  return q;
}

/**
 * Разбирает ссылку на итог. null — если что-то не так: нет результата, баллы не те или не сходятся с результатом
 * (подделанную ссылку показываем как обычный тест).
 */
export function parseSharedResult(
  test: Test,
  q: { r?: string | null; b?: string | null; s?: string | null },
): (SharedResult & { pct?: number }) | null {
  const result = q.r ? findResult(test, q.r) : undefined;
  if (!result || !q.s) return null;
  const keys = scoreKeys(test);
  const values = q.s.split(".");
  if (values.length !== keys.length || values.some((v) => !/^\d{1,3}$/.test(v))) return null;
  const scores = Object.fromEntries(keys.map((k, i) => [k, Number(values[i])]));

  let blendId: string | undefined;
  if (q.b) {
    if (q.b === result.id || !findResult(test, q.b) || !test.blendNotes?.[q.b]) return null;
    blendId = q.b;
  }

  const scales = scalesConfig(test);
  if (scales) {
    const breakdown = scaleBreakdown(test, scores);
    const range = result.range;
    if (!breakdown || blendId || (range && (breakdown.total < range[0] || breakdown.total > range[1]))) return null;
    return { resultId: result.id, scores };
  }
  const ranking = typeRanking(test, scores, { resultId: result.id, blendId });
  if (!ranking) return null;
  if (blendId && ranking[1]?.result.id !== blendId) return null;
  return { resultId: result.id, blendId, scores, pct: ranking[0]?.percent };
}

/** Заголовок и описание превью ссылки на итог: «Холерик 🔥 × Сангвиник ☀️ · GAZ», «Холерик 58%. А ты кто? Тест за 4 мин». */
export function sharedResultMeta(test: Test, shared: SharedResult & { pct?: number }): { title: string; description: string } {
  const result = findResult(test, shared.resultId) as TestResult;
  const blend = shared.blendId ? findResult(test, shared.blendId) : undefined;
  const hero = blend ? `${result.title} ${result.emoji} × ${blend.title} ${blend.emoji}` : `${result.title} ${result.emoji}`;
  const pct = shared.pct === undefined ? "" : ` ${shared.pct}%`;
  return {
    title: `${hero} · GAZ`,
    description: `${result.title}${pct}. А ты кто? Тест за ${test.durationMin} мин`,
  };
}

/** Текст «ответки»: «Я Холерик, ты Сангвиник. Ну что, похожи? 👉 <ссылка>». */
export function answerBackMessage(mine: TestResult, friend: TestResult, link: string): string {
  return `Я ${mine.title}, ты ${friend.title}. Ну что, похожи? 👉 ${link}`;
}
