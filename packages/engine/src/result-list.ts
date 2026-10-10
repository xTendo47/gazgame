// Список на экране результата (howToLoveMe: «Как меня любить», «Как меня убедить», «Зови меня, когда…»).

/**
 * Делит пункт на короткую подпись до двоеточия и текст: «Тебе не хватает: Хаос 🌪️…» → подпись «Тебе не хватает».
 * Подпись — это только короткое начало (до 3 слов, до 20 символов, без запятых), иначе двоеточие — часть фразы:
 * «В ссоре выбирай слова: они бьют сильнее…» остаётся обычным текстом.
 */
export function splitListLabel(item: string): { label?: string; text: string } {
  const colon = item.indexOf(":");
  if (colon <= 0) return { text: item };
  const label = item.slice(0, colon).trim();
  const text = item.slice(colon + 1).trim();
  const words = label.split(/\s+/).length;
  if (!text || words > 3 || label.length > 20 || /[,.!?;—«»"]/.test(label)) return { text: item };
  return { label, text };
}

/**
 * Текст для «Скопировать…»: заголовок с результатом, пункты и ссылка на тест.
 * @param marker чем отмечать пункты (по умолчанию «•»)
 */
export function listCopyText({
  heading,
  result,
  items,
  marker = "•",
  testUrl,
}: {
  heading: string;
  /** Например «⏳ Время вместе». */
  result: string;
  items: readonly string[];
  marker?: string;
  /** Полная ссылка на тест — чтобы друзья из чата сразу прошли. */
  testUrl?: string;
}): string {
  const lines = [`${heading} (${result}):`, ...items.map((item) => `${marker} ${item}`)];
  if (testUrl) lines.push("", `Пройди тест: ${testUrl}`);
  return lines.join("\n");
}
