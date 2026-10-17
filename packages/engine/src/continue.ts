// «Продолжить» на главной: последний незаконченный тест или игра. Ответы теста хранятся в ProgressStore (testProgress),
// начатые игры — там же (gameStarted, только «когда открыли»: ход игры не сохраняем). Здесь проверка и выбор.
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

export interface ContinueGame {
  id: string;
  slug: string;
  title: string;
  emoji: string;
}

/** Игру открыли и не доиграли: через сколько часов карточка «Продолжить» про неё пропадает (ход игры не сохраняется). */
export const GAME_CONTINUE_HOURS = 12;

/** Что показать в «Продолжить»: самый недавний незаконченный тест или игра. Ничего — null (карточки нет). */
export type ContinuePick<T extends ContinueTest, G extends ContinueGame> =
  | { kind: "test"; test: T; /** Номер вопроса, на котором остановились. */ question: number; total: number }
  | { kind: "game"; game: G };

export function pickContinue<T extends ContinueTest, G extends ContinueGame = ContinueGame>(
  tests: readonly T[],
  progress: Readonly<Record<string, TestProgress>>,
  games: readonly G[] = [],
  started: Readonly<Record<string, { at: string }>> = {},
  now: Date = new Date(),
): ContinuePick<T, G> | null {
  let best: { pick: ContinuePick<T, G>; at: string } | null = null;
  for (const test of tests) {
    const saved = progress[test.id];
    const answers = resumeAnswers(test, saved);
    if (!answers || !saved) continue;
    if (!best || saved.at > best.at) best = { pick: { kind: "test", test, question: answers.length + 1, total: test.questions.length }, at: saved.at };
  }
  const limit = now.getTime() - GAME_CONTINUE_HOURS * 3_600_000;
  for (const game of games) {
    const rec = started[game.id];
    if (!rec || Date.parse(rec.at) < limit) continue;
    if (!best || rec.at > best.at) best = { pick: { kind: "game", game }, at: rec.at };
  }
  return best?.pick ?? null;
}
