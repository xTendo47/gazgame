// Шеринг итога теста: что нарисовать на карточке, адрес картинки и ссылка в сообщении.
// Общее для сервера (маршрут картинки) и браузера (меню «Куда кидаем?») — чтобы цифры и ссылки совпадали.
import type { Test } from "@gazgame/content";
import { findResult, scaleBreakdown, scalesConfig, typeRanking } from "@gazgame/engine";

/**
 * Цвет свечения за героем карточки — свой у каждого результата. Ключ: «тест/результат».
 * Держим в коде, а не в JSON: это оформление, а не контент.
 */
const GLOW: Record<string, string> = {
  "temperament/choleric": "#FF5A1F",
  "temperament/sanguine": "#FFC83D",
  "temperament/phlegmatic": "#60D6FF",
  "temperament/melancholic": "#9B7BFF",
  "self-esteem/strict": "#4D8BFF",
  "self-esteem/swing": "#FF4D8D",
  "self-esteem/almost": "#FFC83D",
  "self-esteem/solid": "#2EE6A6",
  "love-languages/words": "#FF4D8D",
  "love-languages/time": "#FFC83D",
  "love-languages/gifts": "#9B7BFF",
  "love-languages/service": "#2EE6A6",
  "love-languages/touch": "#FF5A1F",
  "superpower/spark": "#FF5A1F",
  "superpower/shield": "#60D6FF",
  "superpower/radar": "#9B7BFF",
  "superpower/strategist": "#4D8BFF",
  "superpower/doer": "#FFC83D",
  "superpower/creator": "#D4FF3A",
  "thinking-type/analyst": "#60D6FF",
  "thinking-type/visionary": "#9B7BFF",
  "thinking-type/practical": "#D4FF3A",
  "thinking-type/human": "#FF4D8D",
  "thinking-type/skeptic": "#FFC83D",
  "company-role/mom": "#FF4D8D",
  "company-role/boss": "#FFC83D",
  "company-role/chaos": "#FF5A1F",
  "company-role/soul": "#D4FF3A",
  "company-role/observer": "#4D8BFF",
  "company-role/meme": "#2EE6A6",
};

export function glowColor(testId: string, resultId: string): string {
  return GLOW[`${testId}/${resultId}`] ?? "#FF5A1F";
}

export type ShareFormat = "story" | "preview";
export const SHARE_SIZE: Record<ShareFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  preview: { width: 1200, height: 630 },
};

/** Баллы в одном параметре: «choleric.8,sanguine.4». */
export function encodeScores(scores: Readonly<Record<string, number>>): string {
  return Object.entries(scores)
    .map(([k, v]) => `${k}.${v}`)
    .join(",");
}

export function decodeScores(raw: string | null): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const pair of (raw ?? "").split(",")) {
    const [key, value] = pair.split(".");
    if (key && value && /^\d+$/.test(value)) scores[key] = Number(value);
  }
  return scores;
}

export interface ShareParams {
  slug: string;
  resultId: string;
  blendId?: string;
  scores: Record<string, number>;
  /** Показывать полоски с процентами (переключатель «Показатели»). */
  stats: boolean;
}

/** Адрес PNG: один и тот же для превью в меню и для сторис. */
export function shareImagePath(p: ShareParams, format: ShareFormat = "story"): string {
  const q = new URLSearchParams({ r: p.resultId, f: format, stats: p.stats ? "1" : "0" });
  if (p.blendId) q.set("b", p.blendId);
  const s = encodeScores(p.scores);
  if (s) q.set("s", s);
  return `/share/test/${p.slug}?${q}`;
}

/** Адрес сайта: NEXT_PUBLIC_SITE_URL, иначе тот, с которого открыли. */
export function siteUrl(fallbackOrigin: string): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || fallbackOrigin).replace(/\/+$/, "");
}

/** Ссылка в сообщении: страница теста с пометкой, что пришли по шерингу. */
export function shareLink(site: string, slug: string): string {
  return `${site}/test/${slug}?from=share`;
}

export interface CardBar {
  emoji: string;
  label: string;
  /** «38%» или «5/12». */
  value: string;
  /** Заполнение полоски 0…1. */
  fill: number;
  main: boolean;
}

export interface ShareCard {
  testTitle: string;
  durationMin: number;
  emoji: string;
  title: string;
  subtitle?: string;
  /** «Холерик 🔥 × Сангвиник ☀️». */
  blendLine?: string;
  /** Полоски всех результатов по убыванию (или шкалы); null — показатели скрыты или баллов нет. */
  bars: CardBar[] | null;
  /** До трёх пунктов со значком ✦ (первые strengths). */
  points: string[];
  color: string;
  /** «gazgame.ru/test/temperament». */
  shortLink: string;
}

/** Самая высокая шкала (для {scale} в тексте сообщения). При равенстве — что раньше в списке. */
export function topScale(test: Test, scores: Readonly<Record<string, number>>) {
  const breakdown = scaleBreakdown(test, scores);
  if (!breakdown) return undefined;
  const top = breakdown.scales.reduce((best, s) => (s.score > best.score ? s : best));
  return { title: top.scale.title, emoji: top.scale.emoji };
}

/** Процент основного результата в раскладе (для {pct}) — тот же, что на экране и на карточке. */
export function mainPercent(test: Test, p: Pick<ShareParams, "resultId" | "blendId" | "scores">): number | undefined {
  return typeRanking(test, p.scores, { resultId: p.resultId, blendId: p.blendId })?.find((r) => r.result.id === p.resultId)
    ?.percent;
}

/** Всё, что рисуется на карточке. null — нет такого результата. */
export function buildShareCard(test: Test, p: ShareParams, site: string): ShareCard | null {
  const result = findResult(test, p.resultId);
  if (!result) return null;
  const blend = p.blendId && p.blendId !== p.resultId && test.blendNotes?.[p.blendId] ? findResult(test, p.blendId) : undefined;

  let bars: CardBar[] | null = null;
  if (p.stats) {
    if (scalesConfig(test)) {
      const breakdown = scaleBreakdown(test, p.scores);
      bars =
        breakdown?.scales.map((s) => ({
          emoji: s.scale.emoji,
          label: s.scale.title,
          value: `${s.score}/${s.scale.max}`,
          fill: s.score / s.scale.max,
          main: false,
        })) ?? null;
    } else {
      bars =
        typeRanking(test, p.scores, { resultId: result.id, blendId: blend?.id })?.map((r) => ({
          emoji: r.result.emoji,
          label: r.result.title,
          value: `${r.percent}%`,
          fill: r.max > 0 ? r.score / r.max : 0,
          main: r.result.id === result.id,
        })) ?? null;
    }
  }

  return {
    testTitle: test.title,
    durationMin: test.durationMin,
    emoji: result.emoji,
    title: result.title,
    subtitle: result.subtitle,
    blendLine: blend ? `${result.title} ${result.emoji} × ${blend.title} ${blend.emoji}` : undefined,
    bars,
    points: (result.strengths ?? []).slice(0, 3),
    color: glowColor(test.id, result.id),
    shortLink: `${site.replace(/^https?:\/\//, "")}/test/${test.slug}`,
  };
}
