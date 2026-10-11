// Шеринг итога теста: что нарисовать на карточке, адрес картинки и ссылка в сообщении.
// Общее для сервера (маршрут картинки) и браузера (меню «Куда кидаем?») — чтобы цифры и ссылки совпадали.
import type { ShareStyle, Test } from "@gazgame/content";
import {
  afterWhen,
  findResult,
  ingredientsLine,
  partnerLabel,
  receiptNumber,
  scaleBreakdown,
  scalesConfig,
  sharedResultQuery,
  supportScale,
  topTwo,
  typeRanking,
  type SharedResult,
} from "@gazgame/engine";

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
  "attachment-style/secure": "#2EE6A6",
  "attachment-style/anxious": "#FF4D8D",
  "attachment-style/avoidant": "#9B7BFF",
  "attachment-style/fearful": "#FF5A1F",
};

export function glowColor(testId: string, resultId: string): string {
  return GLOW[`${testId}/${resultId}`] ?? "#FF5A1F";
}

export type ShareFormat = "story" | "preview";
export const SHARE_SIZE: Record<ShareFormat, { width: number; height: number }> = {
  // одна компактная картинка 4:5 — для сторис, чата и «Сохранить картинку»
  story: { width: 1080, height: 1350 },
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
  /** У автора Премиум — маленький 💎 в углу картинки (p=1 в адресе). */
  premium?: boolean;
}

/** Адрес PNG: один и тот же для превью в меню и для сторис. */
export function shareImagePath(p: ShareParams, format: ShareFormat = "story"): string {
  const q = new URLSearchParams({ r: p.resultId, f: format, stats: p.stats ? "1" : "0" });
  if (p.blendId) q.set("b", p.blendId);
  if (p.premium) q.set("p", "1");
  const s = encodeScores(p.scores);
  if (s) q.set("s", s);
  return `/share/test/${p.slug}?${q}`;
}

/** Адрес сайта: NEXT_PUBLIC_SITE_URL, иначе тот, с которого открыли. */
export function siteUrl(fallbackOrigin: string): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || fallbackOrigin).replace(/\/+$/, "");
}

/**
 * Ссылка в сообщении: страница теста с моим итогом — /test/<slug>?from=share&r=…[&b=…]&s=…
 * Сервер прочитает итог для превью (Telegram, VK), а друг увидит «Тебе скинули: …» и начало теста.
 */
export function shareLink(site: string, test: Test, shared: SharedResult): string {
  return `${site}/test/${test.slug}?${new URLSearchParams({ from: "share", ...sharedResultQuery(test, shared) })}`;
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

/** Средний блок карточки — свой у каждого теста (share.style); default — для тестов без костюма. */
export type CardStyle = ShareStyle | "default";

export interface ShareCard {
  style: CardStyle;
  testTitle: string;
  durationMin: number;
  emoji: string;
  title: string;
  subtitle?: string;
  /** «Холерик 🔥 × Сангвиник ☀️». */
  blendLine?: string;
  /** Фирменная строка результата (share.line): «Не взбалтывать: вспыхивает за секунду». */
  line?: string;
  /**
   * Показатели: два первых результата с процентами (у самооценки — три шкалы с баллами).
   * null — «Показатели: нет» или баллов в ссылке нет.
   */
  bars: CardBar[] | null;
  /** До трёх пунктов со значком ✦ (первые strengths); у чека, игрока и мессенджера не нужны. */
  points: string[];
  /** messenger: «📌 Закреплённые» — три первые strengths пузырями сообщений. */
  pinned?: string[];
  /** composition: «холерик, сангвиник, флегматик, меланхолик». */
  ingredients?: string;
  /** batteries: «Моя опора: 💪 Вера в свои силы» или «Опора: всё ровно, без провалов». */
  support?: string;
  /** receipt: номер, дата и позиции чека. */
  receipt?: { number: string; date: string; items: string[] };
  /** hero: «Зови, когда: …»; device: «Совет по эксплуатации: …». */
  hint?: string;
  /** player: «Идеальный дуэт» и «Опасно тусить с». */
  duo?: string;
  danger?: string;
  color: string;
  /** «gazgame.ru/test/temperament». */
  shortLink: string;
  /** Значок Премиума 💎 в углу. */
  premium: boolean;
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

const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

/** Всё, что рисуется на карточке. null — нет такого результата. */
export function buildShareCard(test: Test, p: ShareParams, site: string, now = new Date()): ShareCard | null {
  const result = findResult(test, p.resultId);
  if (!result) return null;
  const blend = p.blendId && p.blendId !== p.resultId && test.blendNotes?.[p.blendId] ? findResult(test, p.blendId) : undefined;
  const lead = { resultId: result.id, blendId: blend?.id };
  const style: CardStyle = test.share?.style ?? "default";
  const firstTip = result.howToLoveMe?.[0];

  // Показатели: только два первых результата (проценты — от всех), у самооценки — три шкалы
  let bars: CardBar[] | null = null;
  if (p.stats) {
    if (scalesConfig(test)) {
      bars =
        scaleBreakdown(test, p.scores)?.scales.map((s) => ({
          emoji: s.scale.emoji,
          label: s.scale.title,
          value: `${s.score}/${s.scale.max}`,
          fill: s.score / s.scale.max,
          main: false,
        })) ?? null;
    } else {
      const two = topTwo(test, p.scores, lead);
      bars = two.length
        ? two.map((r) => ({
            emoji: r.result.emoji,
            label: r.result.title,
            value: `${r.percent}%`,
            fill: r.max > 0 ? r.score / r.max : 0,
            main: r.result.id === result.id,
          }))
        : null;
    }
  }

  const support = supportScale(test, p.scores);
  return {
    style,
    testTitle: test.title,
    durationMin: test.durationMin,
    emoji: result.emoji,
    title: result.title,
    subtitle: result.subtitle,
    blendLine: blend ? `${result.title} ${result.emoji} × ${blend.title} ${blend.emoji}` : undefined,
    line: result.share?.line,
    bars,
    points: style === "receipt" || style === "player" || style === "messenger" ? [] : (result.strengths ?? []).slice(0, 3),
    pinned: style === "messenger" ? (result.strengths ?? []).slice(0, 3) : undefined,
    ingredients: style === "composition" ? ingredientsLine(test, p.scores, lead) : undefined,
    support:
      style === "batteries"
        ? support
          ? `Моя опора: ${support.emoji} ${support.title}`
          : support === null
            ? "Опора: всё ровно, без провалов"
            : undefined
        : undefined,
    receipt:
      style === "receipt"
        ? {
            number: receiptNumber(`${test.id}/${result.id}/${blend?.id ?? ""}/${Object.values(p.scores).join(".")}`),
            date: dateFormat.format(now),
            items: (result.howToLoveMe ?? []).slice(0, 3),
          }
        : undefined,
    hint:
      style === "hero" && firstTip
        ? `Зови, когда: ${afterWhen(firstTip)}`
        : style === "device" && firstTip
          ? `Совет по эксплуатации: ${firstTip}`
          : undefined,
    duo: style === "player" ? partnerLabel(test, result, "duo") : undefined,
    danger: style === "player" ? partnerLabel(test, result, "danger") : undefined,
    color: glowColor(test.id, result.id),
    shortLink: `${site.replace(/^https?:\/\//, "")}/test/${test.slug}`,
    premium: p.premium === true,
  };
}
