// Мелкие помощники для текстов.

/** Убирает эмодзи из строки (тексты в data/*.json пишет основатель с эмодзи; на оформленных экранах значки рисуем SVG). */
export function stripEmoji(text: string): string {
  return text
    .replace(/[\p{Extended_Pictographic}️‍]/gu, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim();
}
