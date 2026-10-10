// Тексты «костюмов» карточки для шеринга (share.style теста). Чистые функции — оформление рисует сайт.
import type { Test, TestResult } from "@gazgame/content";
import { findResult, scaleBreakdown, typeRanking, type RankedType } from "./test-runner";

/** Два первых результата с процентами (главный и следующий). Проценты — от всех результатов. */
export function topTwo(
  test: Test,
  scores: Readonly<Record<string, number>>,
  lead: { resultId?: string; blendId?: string } = {},
): RankedType[] {
  return (typeRanking(test, scores, lead) ?? []).slice(0, 2);
}

/** «холерик, сангвиник, флегматик, меланхолик» — все результаты по убыванию баллов (без баллов — по порядку results). */
export function ingredientsLine(test: Test, scores: Readonly<Record<string, number>>, lead: { resultId?: string; blendId?: string } = {}): string {
  const ordered = typeRanking(test, scores, lead)?.map((r) => r.result) ?? test.results;
  return ordered.map((r) => r.title.toLowerCase()).join(", ");
}

/** «Когда нужно раскачать тусовку» → «нужно раскачать тусовку» — для «Зови, когда: …». */
export function afterWhen(item: string): string {
  const stripped = item.replace(/^когда\s+/i, "");
  return stripped === item ? item : stripped;
}

/** «Идеальный дуэт» / «Опасно тусить с»: другой результат, а если это сама роль — «ещё одна Мамочка 🍼». */
export function partnerLabel(test: Test, result: TestResult, kind: "duo" | "danger"): string | undefined {
  const id = result.share?.[kind];
  const partner = id ? findResult(test, id) : undefined;
  if (!partner) return undefined;
  if (partner.id !== result.id) return `${partner.title} ${partner.emoji}`;
  const one = /[ая]$/i.test(partner.title.split(" ")[0] ?? "") ? "ещё одна" : "ещё один";
  return `${one} ${partner.title} ${partner.emoji}`;
}

/** Самая высокая шкала или null при ровном профиле (для «Моя опора: …»). */
export function supportScale(test: Test, scores: Readonly<Record<string, number>>): { title: string; emoji: string } | null | undefined {
  const breakdown = scaleBreakdown(test, scores);
  if (!breakdown) return undefined;
  if (breakdown.profile.kind === "flat") return null;
  return { title: breakdown.profile.strongest.scale.title, emoji: breakdown.profile.strongest.scale.emoji };
}

/** Номер чека из 4 цифр — один и тот же для одного итога (картинка и превью не расходятся). */
export function receiptNumber(seed: string): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return String((h >>> 0) % 9000 + 1000);
}
