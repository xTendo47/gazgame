// Случайность для перемешивания карточек.
// Функцию random можно подменить — так тесты получают предсказуемый порядок.

export type RandomFn = () => number;

/** Перемешивает копию массива (алгоритм Фишера — Йетса). */
export function shuffle<T>(items: readonly T[], random: RandomFn = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}

/** Предсказуемый генератор случайных чисел (mulberry32) — для тестов. */
export function seededRandom(seed: number): RandomFn {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Индексы 0..n-1 */
export function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}
