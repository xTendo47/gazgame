// Одна общая временная шкала открытия и закрытия коробки на «Чем займёмся?» (мс от нажатия).
// Открытие: крышка 0–450, основание 350–750, содержимое 600–1000 (плитки через 50 мс), памятка 650–1050, фон 0–400 внутрь.
// Закрытие — те же отрезки в обратную сторону, длительности ×0,8: памятка и содержимое уезжают первыми, потом основание, потом крышка.
// Анимируются только transform и opacity.

/** Отрезок шкалы: начало и конец в мс. */
export type Span = readonly [start: number, end: number];

export const OPEN_SPANS = {
  lid: [0, 450],
  base: [350, 750],
  /** Первая плитка; следующие идут с шагом STAGGER. */
  items: [600, 850],
  memo: [650, 1050],
  dimIn: [0, 400],
  dimOut: [400, 1000],
} as const satisfies Record<string, Span>;

/** Задержка между плитками, мс (в пределах 40–60). */
export const STAGGER = 50;
/** Конец всей шкалы открытия, мс. */
export const OPEN_TOTAL = 1050;
/** Закрытие короче открытия: 80% длительности. */
export const CLOSE_RATIO = 0.8;
/** Фон уходит в последние 300 мс закрытия. */
export const CLOSE_DIM_OUT = 300;

/** Тот же отрезок при закрытии: зеркально от конца шкалы, длительность ×0,8. */
export function closeSpan([start, end]: Span): Span {
  return [(OPEN_TOTAL - end) * CLOSE_RATIO, (OPEN_TOTAL - start) * CLOSE_RATIO];
}

/** Сдвиг отрезка (плитки идут по очереди). */
export function shift([start, end]: Span, by: number): Span {
  return [start + by, end + by];
}

/** Длина закрытия, мс: заканчивается, когда крышка легла на место коробки. */
export const CLOSE_TOTAL = closeSpan(OPEN_SPANS.lid)[1];
