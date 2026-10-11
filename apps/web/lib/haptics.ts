// Вибрация-отклик (где есть: Android; на iPhone в браузере вибрации нет — это нормально).
// tick — короткий щелчок (уровень открылся), double — двойной (тап по закрытому уровню).
const PATTERNS = { tick: 10, double: [30, 60, 30] } as const;

export function haptic(kind: keyof typeof PATTERNS) {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    navigator.vibrate?.(PATTERNS[kind] as VibratePattern);
  } catch {
    // вибрации нет — не страшно
  }
}
