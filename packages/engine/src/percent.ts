// Проценты для «Твой расклад» и карточки шеринга: доли в сумме ровно 100.

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
