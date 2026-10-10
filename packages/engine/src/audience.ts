// Версии теста («Кто проходит?» — парень или девушка): тексты вопросов для версии.
// Итоги, баллы и подсчёт общие: баллы, id и порядок ответов всегда из базового вопроса.
import type { Test, TestQuestion } from "@gazgame/content";

/** Текст вопроса и ответов (в базовом порядке) для версии; нет подмены — базовый текст. */
export function questionTexts(question: TestQuestion, audienceId?: string | null): { text: string; options: string[] } {
  const override = audienceId ? question.audience?.[audienceId] : undefined;
  return {
    text: override?.text ?? question.text,
    options: question.options.map((o) => (o.id !== undefined ? override?.options?.[o.id] : undefined) ?? o.text),
  };
}

/** Есть ли у теста такая версия. */
export function isAudience(test: Test, audienceId: string | null | undefined): audienceId is string {
  return !!audienceId && !!test.audience?.options.some((o) => o.id === audienceId);
}

/** «Парень» → «Для парня», «Девушка» → «Для девушки» — мелкая подпись над первым вопросом. */
export function audienceForLabel(label: string): string {
  const word = label.trim();
  const lower = word.charAt(0).toLowerCase() + word.slice(1);
  let genitive = lower;
  if (/ень$/.test(lower)) genitive = lower.replace(/ень$/, "ня");
  else if (/[кгхжшщч]а$/.test(lower)) genitive = lower.replace(/а$/, "и");
  else if (/а$/.test(lower)) genitive = lower.replace(/а$/, "ы");
  return `Для ${genitive}`;
}
