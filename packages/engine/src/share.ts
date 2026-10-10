// Шеринг итогов теста: проценты для «Твой расклад» и карточки, текст сообщения в чат.
import type { Test, TestResult } from "@gazgame/content";

/**
 * Доли в процентах, округлённые так, чтобы в сумме было ровно 100 (метод наибольшего остатка):
 * сначала всем округляем вниз, потом недостающие единицы отдаём тем, у кого остаток больше.
 * При равных остатках — тому, кто раньше в списке. Все нули — все нули.
 */
export function largestRemainderPercents(values: readonly number[]): number[] {
  const safe = values.map((v) => (Number.isFinite(v) && v > 0 ? v : 0));
  const total = safe.reduce((sum, v) => sum + v, 0);
  if (total === 0) return safe.map(() => 0);
  const exact = safe.map((v) => (v / total) * 100);
  const result = exact.map(Math.floor);
  let left = 100 - result.reduce((sum, v) => sum + v, 0);
  const order = exact.map((v, i) => ({ i, rest: v - Math.floor(v) })).sort((a, b) => b.rest - a.rest || a.i - b.i);
  for (const { i } of order) {
    if (left <= 0) break;
    result[i] = (result[i] ?? 0) + 1;
    left--;
  }
  return result;
}

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
