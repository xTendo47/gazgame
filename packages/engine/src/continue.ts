// «Продолжить» на главной: незаконченный тест. Ответы хранятся в ProgressStore (testProgress), тут только проверка и выбор.
import type { TestProgress } from "./storage";

/** Из теста нужно только число вопросов и вариантов у каждого. */
export interface ResumableTest {
  questions: readonly { options: readonly unknown[] }[];
}

/** Сохранённые ответы, если они ещё подходят к тесту (не весь тест и каждый ответ есть среди вариантов); иначе null. */
export function resumeAnswers(test: ResumableTest, saved: TestProgress | null | undefined): number[] | null {
  if (!saved || saved.answers.length === 0 || saved.answers.length >= test.questions.length) return null;
  const fits = saved.answers.every((a, i) => Number.isInteger(a) && a >= 0 && a < (test.questions[i]?.options.length ?? 0));
  return fits ? [...saved.answers] : null;
}

export interface ContinueTest extends ResumableTest {
  id: string;
  slug: string;
  title: string;
  emoji: string;
}

/** Карточка «Продолжить»: самый недавний незаконченный тест. Нет такого — null (карточки нет). */
export function pickContinue<T extends ContinueTest>(
  tests: readonly T[],
  progress: Readonly<Record<string, TestProgress>>,
): { test: T; /** Номер вопроса, на котором остановились. */ question: number; total: number } | null {
  let best: { test: T; question: number; total: number; at: string } | null = null;
  for (const test of tests) {
    const saved = progress[test.id];
    const answers = resumeAnswers(test, saved);
    if (!answers || !saved) continue;
    if (!best || saved.at > best.at) best = { test, question: answers.length + 1, total: test.questions.length, at: saved.at };
  }
  return best && { test: best.test, question: best.question, total: best.total };
}
