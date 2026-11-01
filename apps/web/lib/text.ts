// Мелкие помощники для текстов.

/** Убирает эмодзи из строки (тексты в data/*.json пишет основатель с эмодзи; на оформленных экранах значки рисуем SVG). */
export function stripEmoji(text: string): string {
  return text
    .replace(/[\p{Extended_Pictographic}️‍]/gu, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.!?;:»)])/g, "$1")
    .trim();
}

/**
 * Все тексты игры без эмодзи — для экранов в стиле казино, где значки рисуются SVG. Данные в JSON не трогаем:
 * чистим копию при показе. Остаются поля emoji (по ним подбирается значок), тексты для «Пофлексить» (flex*, share*)
 * и ребусы «Угадай по эмодзи» (карточка text — это и есть смайлики).
 */
export function stripGameEmoji<T>(value: T, key = "", parent: unknown = null): T {
  if (typeof value === "string") {
    if (key === "emoji" || /^(flex|share)/i.test(key)) return value;
    if (key === "text" && parent && typeof parent === "object" && "answer" in parent) return value;
    return stripEmoji(value) as T;
  }
  if (Array.isArray(value)) return value.map((v) => stripGameEmoji(v, key, null)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, stripGameEmoji(v, k, value)])) as T;
  }
  return value;
}
