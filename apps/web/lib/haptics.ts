// Вибрация-отклик (где есть: Android; на iPhone в браузере вибрации нет — это нормально).
// tick — короткий щелчок (уровень открылся), double — двойной (тап по закрытому уровню).
// Раздел GAZ: click — щелчок барабана и чипа, bored — «Мне скучно», take — «Беру!», mark — отметка дня, fanfare — «Сделано».
const PATTERNS = { tick: 10, double: [30, 60, 30], click: 6, bored: 15, take: [10, 40, 10], mark: 20, fanfare: [20, 60, 20, 60, 40], yes: 30, no: [20, 40, 20], hot: 20, timeUp: 300, win: [40, 60, 40, 60, 120] } as const;
// «Объясни 🪧»: yes — свайп вправо (угадали), no — влево (двойное), hot — каждая из последних 5 секунд, timeUp — длинное в 0, win — победа.

export function haptic(kind: keyof typeof PATTERNS) {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    navigator.vibrate?.(PATTERNS[kind] as VibratePattern);
  } catch {
    // вибрации нет — не страшно
  }
}
