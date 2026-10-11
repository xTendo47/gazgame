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

/**
 * Проценты типов в порядке показа (первый — главный тип): доля от суммы баллов, в сумме ровно 100.
 * Каждый округляем обычным образом, остаток от округления отдаём главному типу — так одинаковые баллы
 * дают одинаковые проценты. Если первые два поровну (ничья), остаток отдать главному нельзя (25/25 стало бы 24/25):
 * тогда распределяем методом наибольшего остатка, равные баллы у первых двух всё равно дают равные проценты.
 */
export function rankedPercents(orderedScores: readonly number[]): number[] {
  const safe = orderedScores.map((v) => (Number.isFinite(v) && v > 0 ? v : 0));
  const total = safe.reduce((sum, v) => sum + v, 0);
  if (total === 0) return safe.map(() => 0);
  if (safe.length > 1 && safe[0] === safe[1]) return largestRemainderPercents(safe);
  const rounded = safe.map((v) => Math.round((v / total) * 100));
  const rest = rounded.slice(1).reduce((sum, v) => sum + v, 0);
  rounded[0] = 100 - rest;
  return rounded;
}
